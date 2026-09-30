import pytest
from django.urls import reverse

from apps.quizzes.models import AnswerOption, Question, Quiz, QuizAttemptAnswer

pytestmark = pytest.mark.django_db


def _question(prompt="Which is a red flag?", correct=1, answers=None, **extra):
    answers = answers or ["Urgent tone", "Known sender", "Personal greeting"]
    return {
        "prompt": prompt,
        "competency": "Phishing",
        "points": 1,
        "explanation": "Urgency is a pressure tactic.",
        "answers": [{"text": text, "is_correct": index == correct - 1} for index, text in enumerate(answers)],
        **extra,
    }


def _payload(**overrides):
    payload = {
        "title": "Brand New Quiz",
        "description": "Authored in the admin UI.",
        "time_limit_minutes": 10,
        "pass_score": 70,
        "max_attempts": 0,
        "is_active": True,
        "questions": [_question(), _question("Second question?", correct=2, answers=["No", "Yes"])],
    }
    payload.update(overrides)
    return payload


class TestCreatingAQuiz:
    def test_admin_creates_quiz_with_questions_and_generated_slug(self, admin_client):
        response = admin_client.post(reverse("quizzes-list"), _payload(), format="json")

        assert response.status_code == 201
        quiz = Quiz.objects.get(id=response.json()["id"])
        assert quiz.slug == "brand-new-quiz"
        assert quiz.questions.count() == 2
        assert quiz.questions.first().answers.filter(is_correct=True).count() == 1

    def test_duplicate_titles_get_distinct_slugs(self, admin_client):
        first = admin_client.post(reverse("quizzes-list"), _payload(), format="json").json()["id"]
        second = admin_client.post(reverse("quizzes-list"), _payload(), format="json").json()["id"]

        assert Quiz.objects.get(id=first).slug != Quiz.objects.get(id=second).slug

    def test_normal_user_cannot_create(self, user_client):
        assert user_client.post(reverse("quizzes-list"), _payload(), format="json").status_code == 403

    def test_question_needs_at_least_two_answers(self, admin_client):
        payload = _payload(questions=[_question(answers=["Only one"], correct=1)])

        assert admin_client.post(reverse("quizzes-list"), payload, format="json").status_code == 400

    def test_question_needs_exactly_one_correct_answer(self, admin_client):
        none_correct = _question()
        for answer in none_correct["answers"]:
            answer["is_correct"] = False
        two_correct = _question()
        for answer in two_correct["answers"]:
            answer["is_correct"] = True

        assert admin_client.post(reverse("quizzes-list"), _payload(questions=[none_correct]), format="json").status_code == 400
        assert admin_client.post(reverse("quizzes-list"), _payload(questions=[two_correct]), format="json").status_code == 400


class TestEditorEndpoint:
    def test_admin_sees_which_answers_are_correct(self, admin_client, quiz):
        response = admin_client.get(reverse("quizzes-editor", args=[quiz.id]))

        assert response.status_code == 200
        answers = response.json()["data"]["questions"][0]["answers"]
        assert any(answer["is_correct"] for answer in answers)

    def test_learners_and_officers_cannot_use_it(self, user_client, officer_client, quiz):
        assert user_client.get(reverse("quizzes-editor", args=[quiz.id])).status_code == 403
        assert officer_client.get(reverse("quizzes-editor", args=[quiz.id])).status_code == 403


class TestEditingKeepsHistory:
    def test_editing_in_place_preserves_ids_and_attempt_history(self, admin_client, user_client, quiz):
        question = quiz.questions.first()
        correct = question.answers.get(is_correct=True)
        started = user_client.post(reverse("quizzes-start", args=[quiz.id])).json()["data"]
        user_client.post(
            reverse("quizzes-submit", args=[quiz.id]),
            {"attempt_id": started["id"], "answers": [{"question_id": question.id, "answer_id": correct.id}]},
            format="json",
        )
        assert QuizAttemptAnswer.objects.filter(question=question).exists()

        editor = admin_client.get(reverse("quizzes-editor", args=[quiz.id])).json()["data"]
        editor["questions"][0]["prompt"] = "Reworded prompt"
        editor["questions"][0]["answers"][0]["text"] = "Reworded answer"
        response = admin_client.patch(reverse("quizzes-detail", args=[quiz.id]), {"questions": editor["questions"]}, format="json")

        assert response.status_code == 200
        question.refresh_from_db()
        assert question.prompt == "Reworded prompt"
        assert QuizAttemptAnswer.objects.filter(question=question).exists(), "attempt history must survive an edit"

    def test_removed_questions_and_answers_are_deleted_and_new_ones_added(self, admin_client, quiz):
        editor = admin_client.get(reverse("quizzes-editor", args=[quiz.id])).json()["data"]
        original_ids = [item["id"] for item in editor["questions"]]
        editor["questions"] = editor["questions"][:1] + [_question("Brand new question?")]

        response = admin_client.patch(reverse("quizzes-detail", args=[quiz.id]), {"questions": editor["questions"]}, format="json")

        assert response.status_code == 200
        remaining = list(quiz.questions.values_list("id", flat=True))
        assert original_ids[0] in remaining
        assert len(remaining) == 2
        assert Question.objects.filter(quiz=quiz, prompt="Brand new question?").exists()
        assert AnswerOption.objects.filter(question__quiz=quiz).count() >= 5

    def test_patch_without_questions_leaves_them_alone(self, admin_client, quiz):
        before = quiz.questions.count()

        admin_client.patch(reverse("quizzes-detail", args=[quiz.id]), {"title": "Renamed"}, format="json")

        assert quiz.questions.count() == before
