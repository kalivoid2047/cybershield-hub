from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.quizzes.models import QuizAttempt

pytestmark = pytest.mark.django_db


def _correct_answers(quiz):
    question = quiz.questions.first()
    return [{"question_id": question.id, "answer_id": question.answers.get(is_correct=True).id}]


def _start(client, quiz):
    return client.post(reverse("quizzes-start", args=[quiz.id])).json()["data"]


def _submit(client, quiz, attempt_id, answers):
    return client.post(reverse("quizzes-submit", args=[quiz.id]), {"attempt_id": attempt_id, "answers": answers}, format="json")


class TestExplanationVisibility:
    def test_learner_does_not_receive_explanations_before_grading(self, user_client, quiz):
        question = quiz.questions.first()
        question.explanation = "The spoofed sender is the giveaway."
        question.save()

        body = user_client.get(reverse("quizzes-detail", args=[quiz.id])).json()

        assert all("explanation" not in item for item in body["questions"])
        assert "giveaway" not in str(body)

    def test_staff_still_receive_explanations(self, admin_client, quiz):
        question = quiz.questions.first()
        question.explanation = "The spoofed sender is the giveaway."
        question.save()

        body = admin_client.get(reverse("quizzes-detail", args=[quiz.id])).json()

        assert body["questions"][0]["explanation"] == "The spoofed sender is the giveaway."

    def test_explanation_is_revealed_on_the_graded_attempt(self, user_client, quiz):
        question = quiz.questions.first()
        question.explanation = "The spoofed sender is the giveaway."
        question.save()
        attempt = _start(user_client, quiz)
        _submit(user_client, quiz, attempt["id"], _correct_answers(quiz))

        body = user_client.get(reverse("quiz-attempts-detail", args=[attempt["id"]])).json()

        assert body["answers"][0]["explanation"] == "The spoofed sender is the giveaway."


class TestAttemptLifecycle:
    def test_start_then_submit_grades_the_same_attempt(self, user_client, quiz):
        started = _start(user_client, quiz)

        submitted = _submit(user_client, quiz, started["id"], _correct_answers(quiz)).json()["data"]

        assert submitted["id"] == started["id"]
        assert QuizAttempt.objects.filter(quiz=quiz).count() == 1
        assert submitted["completed_at"] is not None

    def test_duration_is_measured_from_start(self, user_client, quiz):
        started = _start(user_client, quiz)
        QuizAttempt.objects.filter(id=started["id"]).update(started_at=timezone.now() - timedelta(seconds=90))

        submitted = _submit(user_client, quiz, started["id"], _correct_answers(quiz)).json()["data"]

        assert 90 <= submitted["duration_seconds"] < 120

    def test_start_twice_resumes_the_open_attempt(self, user_client, quiz):
        first = _start(user_client, quiz)
        second = _start(user_client, quiz)

        assert first["id"] == second["id"]
        assert QuizAttempt.objects.filter(quiz=quiz).count() == 1

    def test_start_after_completion_creates_a_new_attempt(self, user_client, quiz):
        first = _start(user_client, quiz)
        _submit(user_client, quiz, first["id"], _correct_answers(quiz))

        second = _start(user_client, quiz)

        assert second["id"] != first["id"]

    def test_start_after_time_limit_creates_a_new_attempt(self, user_client, quiz):
        first = _start(user_client, quiz)
        QuizAttempt.objects.filter(id=first["id"]).update(started_at=timezone.now() - timedelta(minutes=quiz.time_limit_minutes + 1))

        second = _start(user_client, quiz)

        assert second["id"] != first["id"]

    def test_users_do_not_resume_each_others_attempts(self, user_client, other_normal_user, api_client, quiz):
        mine = _start(user_client, quiz)
        api_client.force_authenticate(user=other_normal_user)

        theirs = _start(api_client, quiz)

        assert theirs["id"] != mine["id"]

    def test_resubmitting_a_completed_attempt_is_rejected_and_score_kept(self, user_client, quiz):
        started = _start(user_client, quiz)
        _submit(user_client, quiz, started["id"], _correct_answers(quiz))
        question = quiz.questions.first()
        wrong = question.answers.get(is_correct=False)

        response = _submit(user_client, quiz, started["id"], [{"question_id": question.id, "answer_id": wrong.id}])

        assert response.status_code == 400
        assert float(QuizAttempt.objects.get(id=started["id"]).score) == 100

    def test_submit_with_unknown_attempt_id_is_404_not_500(self, user_client, quiz):
        response = _submit(user_client, quiz, 999999, _correct_answers(quiz))
        assert response.status_code == 404

    def test_cannot_submit_someone_elses_attempt(self, user_client, other_normal_user, api_client, quiz):
        started = _start(user_client, quiz)
        api_client.force_authenticate(user=other_normal_user)

        response = _submit(api_client, quiz, started["id"], _correct_answers(quiz))

        assert response.status_code == 404
