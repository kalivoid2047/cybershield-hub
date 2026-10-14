import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


def _patch(client, quiz, payload):
    return client.patch(reverse("quizzes-detail", args=[quiz.id]), payload, format="json")


class TestEditingMaxAttempts:
    def test_admin_can_set_a_limit(self, admin_client, quiz):
        response = _patch(admin_client, quiz, {"max_attempts": 3})

        assert response.status_code == 200
        assert response.json()["max_attempts"] == 3
        quiz.refresh_from_db()
        assert quiz.max_attempts == 3

    def test_admin_can_set_unlimited_with_zero(self, admin_client, quiz):
        quiz.max_attempts = 3
        quiz.save()

        assert _patch(admin_client, quiz, {"max_attempts": 0}).status_code == 200

        quiz.refresh_from_db()
        assert quiz.max_attempts == 0

    def test_patching_only_max_attempts_leaves_questions_and_answers_intact(self, admin_client, quiz):
        question_ids = list(quiz.questions.values_list("id", flat=True))
        answer_ids = list(quiz.questions.first().answers.values_list("id", flat=True))

        _patch(admin_client, quiz, {"max_attempts": 2})

        assert list(quiz.questions.values_list("id", flat=True)) == question_ids
        assert list(quiz.questions.first().answers.values_list("id", flat=True)) == answer_ids
        assert quiz.questions.first().answers.filter(is_correct=True).exists()

    @pytest.mark.parametrize("bad", [-1, 101, 1000, "abc", 2.5, None])
    def test_rejects_invalid_values(self, admin_client, quiz, bad):
        response = _patch(admin_client, quiz, {"max_attempts": bad})

        assert response.status_code == 400
        quiz.refresh_from_db()
        assert quiz.max_attempts == 0

    def test_upper_bound_is_accepted(self, admin_client, quiz):
        assert _patch(admin_client, quiz, {"max_attempts": 100}).status_code == 200

    def test_normal_user_cannot_change_limit(self, user_client, quiz):
        assert _patch(user_client, quiz, {"max_attempts": 5}).status_code == 403
        quiz.refresh_from_db()
        assert quiz.max_attempts == 0

    def test_anonymous_cannot_change_limit(self, api_client, quiz):
        assert _patch(api_client, quiz, {"max_attempts": 5}).status_code == 401

    def test_new_limit_takes_effect_for_learners_immediately(self, admin_client, user_client, quiz):
        _patch(admin_client, quiz, {"max_attempts": 1})
        question = quiz.questions.first()
        started = user_client.post(reverse("quizzes-start", args=[quiz.id])).json()["data"]
        user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"attempt_id": started["id"], "answers": [{"question_id": question.id, "answer_id": question.answers.first().id}]},
            format="json",
        )

        assert user_client.post(reverse("quizzes-start", args=[quiz.id])).status_code == 403

    def test_admin_list_includes_inactive_quizzes_with_their_limit(self, admin_client, quiz):
        quiz.is_active = False
        quiz.max_attempts = 4
        quiz.save()

        rows = admin_client.get(reverse("quizzes-list")).json()["results"]

        row = next(item for item in rows if item["id"] == quiz.id)
        assert row["max_attempts"] == 4 and row["is_active"] is False


class TestEditingPassMarkAndTimeLimit:
    def test_admin_can_change_pass_mark_and_time_limit_together(self, admin_client, quiz):
        response = _patch(admin_client, quiz, {"pass_score": 85, "time_limit_minutes": 20})

        assert response.status_code == 200
        quiz.refresh_from_db()
        assert (quiz.pass_score, quiz.time_limit_minutes) == (85, 20)

    def test_changing_one_field_leaves_the_others_alone(self, admin_client, quiz):
        quiz.max_attempts = 3
        quiz.time_limit_minutes = 15
        quiz.save()
        original_pass = quiz.pass_score

        _patch(admin_client, quiz, {"time_limit_minutes": 30})

        quiz.refresh_from_db()
        assert quiz.time_limit_minutes == 30
        assert quiz.pass_score == original_pass
        assert quiz.max_attempts == 3

    @pytest.mark.parametrize("bad", [0, -5, 101, 500, "abc", None, 79.5])
    def test_rejects_invalid_pass_mark(self, admin_client, quiz, bad):
        original = quiz.pass_score

        response = _patch(admin_client, quiz, {"pass_score": bad})

        assert response.status_code == 400
        quiz.refresh_from_db()
        assert quiz.pass_score == original

    @pytest.mark.parametrize("good", [1, 100])
    def test_pass_mark_bounds_are_inclusive(self, admin_client, quiz, good):
        assert _patch(admin_client, quiz, {"pass_score": good}).status_code == 200

    @pytest.mark.parametrize("bad", [0, -1, 241, 10000, "ten", None, 7.5])
    def test_rejects_invalid_time_limit(self, admin_client, quiz, bad):
        original = quiz.time_limit_minutes

        response = _patch(admin_client, quiz, {"time_limit_minutes": bad})

        assert response.status_code == 400
        quiz.refresh_from_db()
        assert quiz.time_limit_minutes == original

    @pytest.mark.parametrize("good", [1, 240])
    def test_time_limit_bounds_are_inclusive(self, admin_client, quiz, good):
        assert _patch(admin_client, quiz, {"time_limit_minutes": good}).status_code == 200

    def test_one_invalid_field_rejects_the_whole_update(self, admin_client, quiz):
        original = quiz.time_limit_minutes

        response = _patch(admin_client, quiz, {"pass_score": 90, "time_limit_minutes": 0})

        assert response.status_code == 400
        quiz.refresh_from_db()
        assert quiz.time_limit_minutes == original and quiz.pass_score != 90

    def test_learner_cannot_change_them(self, user_client, quiz):
        original = quiz.pass_score

        assert _patch(user_client, quiz, {"pass_score": 1}).status_code == 403
        quiz.refresh_from_db()
        assert quiz.pass_score == original

    def test_new_pass_mark_applies_to_future_grading_only(self, admin_client, user_client, quiz):
        question = quiz.questions.first()
        wrong = question.answers.get(is_correct=False)
        right = question.answers.get(is_correct=True)
        submit = lambda answer: user_client.post(  # noqa: E731
            reverse("quizzes-submit", args=[quiz.id]), {"answers": [{"question_id": question.id, "answer_id": answer.id}]}, format="json"
        ).json()["data"]

        before = submit(right)
        _patch(admin_client, quiz, {"pass_score": 100})
        after_wrong = submit(wrong)

        assert before["passed"] is True
        assert after_wrong["passed"] is False
        # The earlier attempt keeps the outcome it was graded with.
        assert user_client.get(reverse("quiz-attempts-detail", args=[before["id"]])).json()["passed"] is True
        assert user_client.get(reverse("quiz-attempts-detail", args=[before["id"]])).json()["pass_score"] == 100

    def test_start_resume_window_follows_the_new_time_limit(self, admin_client, user_client, quiz):
        from datetime import timedelta

        from django.utils import timezone

        from apps.quizzes.models import QuizAttempt

        first = user_client.post(reverse("quizzes-start", args=[quiz.id])).json()["data"]
        QuizAttempt.objects.filter(id=first["id"]).update(started_at=timezone.now() - timedelta(minutes=30))
        _patch(admin_client, quiz, {"time_limit_minutes": 45})

        resumed = user_client.post(reverse("quizzes-start", args=[quiz.id])).json()["data"]

        assert resumed["id"] == first["id"]
