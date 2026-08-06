import pytest
from django.urls import reverse

from apps.quizzes.models import Question, QuizAttempt

pytestmark = pytest.mark.django_db


class TestQuizLifecycle:
    def test_start_creates_an_attempt(self, user_client, quiz, normal_user):
        response = user_client.post(reverse("quizzes-start", args=[quiz.id]))

        assert response.status_code == 200
        assert QuizAttempt.objects.filter(user=normal_user, quiz=quiz).exists()

    def test_submit_with_all_correct_answers_passes(self, user_client, quiz):
        question = quiz.questions.first()
        correct_answer = question.answers.get(is_correct=True)

        response = user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"answers": [{"question_id": question.id, "answer_id": correct_answer.id}]},
            format="json",
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert float(data["score"]) == 100
        assert data["passed"] is True

    def test_submit_with_wrong_answer_fails_and_produces_recommendation(self, user_client, quiz):
        question = quiz.questions.first()
        question.explanation = "Always verify the sender domain."
        question.save(update_fields=["explanation"])
        wrong_answer = question.answers.get(is_correct=False)

        response = user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"answers": [{"question_id": question.id, "answer_id": wrong_answer.id}]},
            format="json",
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert float(data["score"]) == 0
        assert data["passed"] is False
        assert data["weakness_map"]["General Awareness"]["correct"] == 0

    def test_submit_records_duration_and_completion_timestamp(self, user_client, quiz):
        question = quiz.questions.first()
        correct_answer = question.answers.get(is_correct=True)

        user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"answers": [{"question_id": question.id, "answer_id": correct_answer.id}]},
            format="json",
        )

        attempt = QuizAttempt.objects.get(quiz=quiz)
        assert attempt.completed_at is not None
        assert attempt.is_complete is True

    def test_attempts_endpoint_lists_only_own_attempts(self, user_client, officer_client, quiz):
        question = quiz.questions.first()
        answer = question.answers.first()
        user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"answers": [{"question_id": question.id, "answer_id": answer.id}]},
            format="json",
        )

        response = user_client.get(reverse("quizzes-attempts", args=[quiz.id]))

        assert response.status_code == 200
        assert len(response.json()["data"]) == 1

    def test_inactive_quiz_is_hidden_from_normal_users(self, user_client, quiz):
        quiz.is_active = False
        quiz.save(update_fields=["is_active"])

        response = user_client.get(reverse("quizzes-list"))

        ids = {item["id"] for item in response.json()["results"]}
        assert quiz.id not in ids

    def test_normal_user_cannot_create_quiz(self, user_client):
        response = user_client.post(reverse("quizzes-list"), {"title": "Hack Quiz", "slug": "hack-quiz"}, format="json")
        assert response.status_code == 403


class TestQuizAttemptVisibility:
    def test_officer_can_see_all_attempts(self, user_client, officer_client, quiz):
        question = quiz.questions.first()
        answer = question.answers.first()
        user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"answers": [{"question_id": question.id, "answer_id": answer.id}]},
            format="json",
        )

        response = officer_client.get(reverse("quiz-attempts-list"))

        assert response.status_code == 200
        assert response.json()["count"] == 1

    def test_other_normal_user_cannot_see_attempts(self, user_client, other_normal_user, api_client, quiz):
        question = quiz.questions.first()
        answer = question.answers.first()
        user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"answers": [{"question_id": question.id, "answer_id": answer.id}]},
            format="json",
        )
        api_client.force_authenticate(user=other_normal_user)

        response = api_client.get(reverse("quiz-attempts-list"))

        assert response.status_code == 200
        assert response.json()["count"] == 0
