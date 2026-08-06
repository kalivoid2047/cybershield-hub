import pytest

from apps.quizzes.models import QuizAttempt
from apps.quizzes.services import grade_quiz_attempt

pytestmark = pytest.mark.django_db


def test_grade_quiz_attempt_computes_weighted_score(quiz, normal_user):
    question = quiz.questions.first()
    correct_answer = question.answers.get(is_correct=True)
    attempt = QuizAttempt.objects.create(user=normal_user, quiz=quiz)

    graded = grade_quiz_attempt(attempt, [{"question_id": question.id, "answer_id": correct_answer.id}])

    assert graded.earned_points == question.points
    assert graded.total_points == question.points
    assert graded.score == 100
    assert graded.passed is True
    assert graded.completed_at is not None


def test_grade_quiz_attempt_with_unanswered_question_scores_zero_for_it(quiz, normal_user):
    question = quiz.questions.first()
    attempt = QuizAttempt.objects.create(user=normal_user, quiz=quiz)

    graded = grade_quiz_attempt(attempt, [])

    assert graded.earned_points == 0
    assert graded.score == 0
    assert graded.passed is False


def test_grade_quiz_attempt_ignores_answer_belonging_to_another_question(quiz, normal_user):
    question = quiz.questions.first()
    other_question = quiz.questions.create(prompt="Another question", points=5)
    foreign_answer = other_question.answers.create(text="n/a", is_correct=True)
    attempt = QuizAttempt.objects.create(user=normal_user, quiz=quiz)

    graded = grade_quiz_attempt(attempt, [{"question_id": question.id, "answer_id": foreign_answer.id}])

    assert graded.earned_points == 0
