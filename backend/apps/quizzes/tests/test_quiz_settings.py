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

    def test_officer_cannot_change_limit(self, officer_client, quiz):
        assert _patch(officer_client, quiz, {"max_attempts": 5}).status_code == 403

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
