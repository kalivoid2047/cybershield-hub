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


class TestQuizResultsDetail:
    def _submit_wrong(self, user_client, quiz):
        question = quiz.questions.first()
        wrong = question.answers.get(is_correct=False)
        response = user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"answers": [{"question_id": question.id, "answer_id": wrong.id}]},
            format="json",
        )
        return question, wrong, response.json()["data"]

    def test_result_reveals_correct_answer_and_explanation_after_grading(self, user_client, quiz):
        question, wrong, data = self._submit_wrong(user_client, quiz)
        question.explanation = "Spoofed senders are a classic phishing signal."
        question.save()

        response = user_client.get(reverse("quiz-attempts-detail", args=[data["id"]]))

        assert response.status_code == 200
        row = response.json()["answers"][0]
        assert row["is_correct"] is False
        assert row["selected_text"] == wrong.text
        assert row["correct_answer_text"] == "Yes"
        assert row["explanation"] == "Spoofed senders are a classic phishing signal."
        assert row["competency"] == question.competency

    def test_result_includes_pass_mark_and_lesson_to_review(self, user_client, quiz):
        _, _, data = self._submit_wrong(user_client, quiz)

        body = user_client.get(reverse("quiz-attempts-detail", args=[data["id"]])).json()

        assert body["pass_score"] == quiz.pass_score
        assert body["lesson_slug"] == quiz.lesson.slug
        assert body["lesson_title"] == quiz.lesson.title

    def test_result_for_quiz_without_lesson_omits_lesson_fields(self, user_client, quiz):
        quiz.lesson = None
        quiz.save()
        _, _, data = self._submit_wrong(user_client, quiz)

        body = user_client.get(reverse("quiz-attempts-detail", args=[data["id"]])).json()

        assert "lesson_slug" not in body

    def test_unanswered_question_has_no_selected_text_but_shows_correct_answer(self, user_client, quiz):
        answered = quiz.questions.first()
        skipped = quiz.questions.create(prompt="Skipped question?", points=1, order=5)
        skipped.answers.create(text="Yes", is_correct=True, order=0)
        skipped.answers.create(text="No", is_correct=False, order=1)
        data = user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"answers": [{"question_id": answered.id, "answer_id": answered.answers.get(is_correct=True).id}]},
            format="json",
        ).json()["data"]

        rows = user_client.get(reverse("quiz-attempts-detail", args=[data["id"]])).json()["answers"]
        row = next(item for item in rows if item["question"] == skipped.id)

        assert row["selected_answer"] is None
        assert "selected_text" not in row
        assert row["correct_answer_text"] == "Yes"

    def test_other_user_cannot_open_someone_elses_result(self, user_client, other_normal_user, api_client, quiz):
        _, _, data = self._submit_wrong(user_client, quiz)
        api_client.force_authenticate(user=other_normal_user)

        response = api_client.get(reverse("quiz-attempts-detail", args=[data["id"]]))

        assert response.status_code == 404

    def test_attempt_detail_does_not_query_per_answer(self, user_client, quiz, django_assert_max_num_queries):
        for index in range(6):
            question = quiz.questions.create(prompt=f"Extra {index}?", points=1)
            question.answers.create(text="Right", is_correct=True, order=0)
            question.answers.create(text="Wrong", is_correct=False, order=1)
        first = quiz.questions.first()
        data = user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"answers": [{"question_id": first.id, "answer_id": first.answers.first().id}]},
            format="json",
        ).json()["data"]

        with django_assert_max_num_queries(10):
            response = user_client.get(reverse("quiz-attempts-detail", args=[data["id"]]))

        assert response.status_code == 200
        assert len(response.json()["answers"]) == 7
