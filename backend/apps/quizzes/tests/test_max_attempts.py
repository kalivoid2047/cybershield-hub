import pytest
from django.urls import reverse

from apps.quizzes.models import QuizAttempt

pytestmark = pytest.mark.django_db


def _answers(quiz):
    question = quiz.questions.first()
    return [{"question_id": question.id, "answer_id": question.answers.get(is_correct=True).id}]


def _take(client, quiz):
    """Start and submit one attempt; returns the submit response."""
    started = client.post(reverse("quizzes-start", args=[quiz.id])).json()["data"]
    return client.post(reverse("quizzes-submit", args=[quiz.id]), {"attempt_id": started["id"], "answers": _answers(quiz)}, format="json")


@pytest.fixture
def limited_quiz(quiz):
    quiz.max_attempts = 2
    quiz.save()
    return quiz


class TestEnforcement:
    def test_unlimited_quiz_allows_any_number_of_attempts(self, user_client, quiz):
        assert quiz.max_attempts == 0
        for _ in range(4):
            assert _take(user_client, quiz).status_code == 200

    def test_start_is_blocked_once_attempts_are_used_up(self, user_client, limited_quiz):
        _take(user_client, limited_quiz)
        _take(user_client, limited_quiz)

        response = user_client.post(reverse("quizzes-start", args=[limited_quiz.id]))

        assert response.status_code == 403
        body = response.json()
        assert body["error"]["code"] == "max_attempts_reached"
        assert "attempts" in body["error"]["message"].lower()
        assert QuizAttempt.objects.filter(quiz=limited_quiz).count() == 2

    def test_last_allowed_attempt_still_works(self, user_client, limited_quiz):
        _take(user_client, limited_quiz)

        assert _take(user_client, limited_quiz).status_code == 200

    def test_submit_without_attempt_id_is_also_blocked(self, user_client, limited_quiz):
        _take(user_client, limited_quiz)
        _take(user_client, limited_quiz)

        response = user_client.post(reverse("quizzes-submit", args=[limited_quiz.id]), {"answers": _answers(limited_quiz)}, format="json")

        assert response.status_code == 403
        assert QuizAttempt.objects.filter(quiz=limited_quiz).count() == 2

    def test_open_attempt_created_before_the_limit_cannot_be_submitted_past_it(self, user_client, limited_quiz, normal_user):
        # A stray open attempt (e.g. from before the limit was lowered) must not
        # let the user exceed the limit at submit time.
        _take(user_client, limited_quiz)
        _take(user_client, limited_quiz)
        stray = QuizAttempt.objects.create(user=normal_user, quiz=limited_quiz)

        response = user_client.post(
            reverse("quizzes-submit", args=[limited_quiz.id]), {"attempt_id": stray.id, "answers": _answers(limited_quiz)}, format="json"
        )

        assert response.status_code == 403
        stray.refresh_from_db()
        assert stray.completed_at is None

    def test_abandoned_open_attempt_does_not_use_up_an_attempt(self, user_client, limited_quiz):
        user_client.post(reverse("quizzes-start", args=[limited_quiz.id]))  # opened, never submitted

        assert _take(user_client, limited_quiz).status_code == 200
        assert _take(user_client, limited_quiz).status_code == 200

    def test_resuming_an_open_attempt_is_allowed_when_only_one_attempt_is_left(self, user_client, limited_quiz):
        _take(user_client, limited_quiz)
        first = user_client.post(reverse("quizzes-start", args=[limited_quiz.id])).json()["data"]

        again = user_client.post(reverse("quizzes-start", args=[limited_quiz.id]))

        assert again.status_code == 200
        assert again.json()["data"]["id"] == first["id"]

    def test_limit_is_per_user(self, user_client, other_normal_user, api_client, limited_quiz):
        _take(user_client, limited_quiz)
        _take(user_client, limited_quiz)
        api_client.force_authenticate(user=other_normal_user)

        assert _take(api_client, limited_quiz).status_code == 200

    def test_raising_the_limit_restores_access(self, user_client, limited_quiz):
        _take(user_client, limited_quiz)
        _take(user_client, limited_quiz)
        limited_quiz.max_attempts = 3
        limited_quiz.save()

        assert _take(user_client, limited_quiz).status_code == 200


class TestUsageReporting:
    def _quiz_row(self, client, quiz):
        results = client.get(reverse("quizzes-list")).json()["results"]
        return next(item for item in results if item["id"] == quiz.id)

    def test_list_reports_used_and_remaining(self, user_client, limited_quiz):
        _take(user_client, limited_quiz)

        row = self._quiz_row(user_client, limited_quiz)

        assert row["attempts_used"] == 1
        assert row["attempts_remaining"] == 1
        assert row["max_attempts"] == 2

    def test_unlimited_quiz_reports_null_remaining(self, user_client, quiz):
        _take(user_client, quiz)

        row = self._quiz_row(user_client, quiz)

        assert row["attempts_used"] == 1
        assert row["attempts_remaining"] is None

    def test_counts_are_not_inflated_by_the_questions_join(self, user_client, limited_quiz):
        for index in range(4):
            question = limited_quiz.questions.create(prompt=f"Extra {index}?", points=1)
            question.answers.create(text="Right", is_correct=True, order=0)
        _take(user_client, limited_quiz)

        row = self._quiz_row(user_client, limited_quiz)

        assert row["question_count"] == 5
        assert row["attempts_used"] == 1

    def test_only_completed_attempts_are_counted(self, user_client, limited_quiz):
        user_client.post(reverse("quizzes-start", args=[limited_quiz.id]))

        assert self._quiz_row(user_client, limited_quiz)["attempts_used"] == 0

    def test_other_users_attempts_are_not_counted(self, user_client, other_normal_user, api_client, limited_quiz):
        api_client.force_authenticate(user=other_normal_user)
        _take(api_client, limited_quiz)

        assert self._quiz_row(user_client, limited_quiz)["attempts_used"] == 0

    def test_detail_reports_usage(self, user_client, limited_quiz):
        _take(user_client, limited_quiz)

        body = user_client.get(reverse("quizzes-detail", args=[limited_quiz.id])).json()

        assert body["attempts_used"] == 1
        assert body["attempts_remaining"] == 1

    def test_graded_attempt_reports_attempts_remaining(self, user_client, limited_quiz):
        response = _take(user_client, limited_quiz).json()["data"]

        assert response["attempts_remaining"] == 1
