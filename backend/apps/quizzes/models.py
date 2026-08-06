from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class Quiz(TimeStampedModel):
    title = models.CharField(max_length=220)
    slug = models.SlugField(max_length=240, unique=True)
    description = models.TextField(blank=True)
    lesson = models.ForeignKey("training.Lesson", on_delete=models.SET_NULL, related_name="quizzes", null=True, blank=True)
    category = models.ForeignKey("training.LessonCategory", on_delete=models.SET_NULL, related_name="quizzes", null=True, blank=True)
    time_limit_minutes = models.PositiveIntegerField(default=10)
    pass_score = models.PositiveIntegerField(default=80)
    max_attempts = models.PositiveIntegerField(default=0, help_text="0 means unlimited.")
    is_active = models.BooleanField(default=True, db_index=True)
    randomize_questions = models.BooleanField(default=True)
    created_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_quizzes")

    class Meta:
        db_table = "quizzes"
        ordering = ["title"]
        indexes = [models.Index(fields=["slug", "is_active"])]

    def __str__(self):
        return self.title


class Question(TimeStampedModel):
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="questions")
    prompt = models.TextField()
    explanation = models.TextField(blank=True)
    competency = models.CharField(max_length=120, default="General Awareness")
    points = models.PositiveIntegerField(default=1)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "questions"
        ordering = ["order", "id"]

    def __str__(self):
        return self.prompt[:80]


class AnswerOption(TimeStampedModel):
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name="answers")
    text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "answers"
        ordering = ["order", "id"]

    def __str__(self):
        return self.text[:80]


class QuizAttempt(TimeStampedModel):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="quiz_attempts")
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name="attempts")
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    total_points = models.PositiveIntegerField(default=0)
    earned_points = models.PositiveIntegerField(default=0)
    passed = models.BooleanField(default=False)
    started_at = models.DateTimeField(default=timezone.now)
    completed_at = models.DateTimeField(blank=True, null=True)
    duration_seconds = models.PositiveIntegerField(default=0)
    weakness_map = models.JSONField(default=dict, blank=True)
    recommendations = models.JSONField(default=list, blank=True)

    class Meta:
        db_table = "quiz_attempts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "quiz", "created_at"]),
            models.Index(fields=["passed", "score"]),
        ]

    @property
    def is_complete(self):
        return self.completed_at is not None


class QuizAttemptAnswer(TimeStampedModel):
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_answer = models.ForeignKey(AnswerOption, on_delete=models.SET_NULL, null=True, blank=True)
    is_correct = models.BooleanField(default=False)
    points_awarded = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "quiz_attempt_answers"
        unique_together = ("attempt", "question")
