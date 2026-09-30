from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

from apps.quizzes.models import AnswerOption, QuizAttempt, QuizAttemptAnswer


class MaxAttemptsReached(PermissionDenied):
    default_code = "max_attempts_reached"
    default_detail = "You have used all of your attempts for this quiz."


def attempts_remaining(user, quiz):
    """Attempts the user has left on ``quiz``; ``None`` when the quiz is unlimited.

    Only completed attempts count, so opening a quiz and leaving does not burn one.
    """
    if not quiz.max_attempts:
        return None
    used = QuizAttempt.objects.filter(user=user, quiz=quiz, completed_at__isnull=False).count()
    return max(0, quiz.max_attempts - used)


def ensure_can_attempt(user, quiz):
    if attempts_remaining(user, quiz) == 0:
        raise MaxAttemptsReached()


@transaction.atomic
def grade_quiz_attempt(attempt, submitted_answers):
    answer_map = {int(item["question_id"]): int(item["answer_id"]) for item in submitted_answers}
    questions = attempt.quiz.questions.prefetch_related("answers").all()
    total_points = 0
    earned_points = 0
    weakness = {}
    explanations = []

    for question in questions:
        total_points += question.points
        selected_id = answer_map.get(question.id)
        selected = AnswerOption.objects.filter(id=selected_id, question=question).first() if selected_id else None
        correct = bool(selected and selected.is_correct)
        points = question.points if correct else 0
        earned_points += points
        QuizAttemptAnswer.objects.update_or_create(
            attempt=attempt,
            question=question,
            defaults={
                "selected_answer": selected,
                "is_correct": correct,
                "points_awarded": points,
            },
        )
        competency = question.competency or "General Awareness"
        bucket = weakness.setdefault(competency, {"correct": 0, "total": 0})
        bucket["total"] += 1
        bucket["correct"] += 1 if correct else 0
        if not correct and question.explanation:
            explanations.append({"competency": competency, "recommendation": question.explanation})

    score = round((earned_points / total_points) * 100, 2) if total_points else 0
    for competency, value in weakness.items():
        value["score"] = round((value["correct"] / value["total"]) * 100, 2) if value["total"] else 0

    attempt.total_points = total_points
    attempt.earned_points = earned_points
    attempt.score = score
    attempt.passed = score >= attempt.quiz.pass_score
    attempt.completed_at = timezone.now()
    attempt.duration_seconds = int((attempt.completed_at - attempt.started_at).total_seconds())
    attempt.weakness_map = weakness
    attempt.recommendations = explanations[:5]
    attempt.save()
    return attempt
