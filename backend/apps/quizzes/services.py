from django.db import transaction
from django.utils import timezone

from apps.quizzes.models import AnswerOption, QuizAttemptAnswer


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
