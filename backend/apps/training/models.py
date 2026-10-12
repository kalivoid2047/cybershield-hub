from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class LessonCategory(TimeStampedModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    description = models.TextField(blank=True)
    icon = models.CharField(max_length=80, blank=True)
    color = models.CharField(max_length=24, default="#38bdf8")
    order = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "lesson_categories"
        ordering = ["order", "name"]

    def __str__(self):
        return self.name


class Lesson(TimeStampedModel):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    DIFFICULTY_CHOICES = (
        (BEGINNER, "Beginner"),
        (INTERMEDIATE, "Intermediate"),
        (ADVANCED, "Advanced"),
    )

    category = models.ForeignKey(LessonCategory, on_delete=models.PROTECT, related_name="lessons")
    title = models.CharField(max_length=220)
    slug = models.SlugField(max_length=240, unique=True)
    summary = models.TextField()
    content = models.TextField(help_text="Markdown or sanitized HTML content.")
    media_url = models.URLField(blank=True)
    estimated_minutes = models.PositiveIntegerField(default=8)
    difficulty = models.CharField(max_length=24, choices=DIFFICULTY_CHOICES, default=BEGINNER)
    tags = models.JSONField(default=list, blank=True)
    is_published = models.BooleanField(default=False, db_index=True)
    recommended_for_roles = models.JSONField(default=list, blank=True)
    created_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_lessons")

    class Meta:
        db_table = "lessons"
        ordering = ["category__order", "title"]
        indexes = [
            models.Index(fields=["slug"]),
            models.Index(fields=["difficulty", "is_published"]),
        ]

    def __str__(self):
        return self.title

    def quiz_required_for(self, user):
        """True if the lesson has an active quiz the user has not yet finished an attempt on."""
        from apps.quizzes.models import Quiz, QuizAttempt

        quiz_ids = list(Quiz.objects.filter(lesson=self, is_active=True).values_list("id", flat=True))
        if not quiz_ids:
            return False
        return not QuizAttempt.objects.filter(user=user, quiz_id__in=quiz_ids, completed_at__isnull=False).exists()


class LessonProgress(TimeStampedModel):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="lesson_progress")
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="progress")
    progress_percent = models.PositiveIntegerField(default=0)
    completed_at = models.DateTimeField(blank=True, null=True)
    last_viewed_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "lesson_progress"
        unique_together = ("user", "lesson")
        indexes = [
            models.Index(fields=["user", "completed_at"]),
            models.Index(fields=["lesson", "progress_percent"]),
        ]

    def mark_progress(self, percent):
        self.progress_percent = max(0, min(100, int(percent)))
        self.last_viewed_at = timezone.now()
        if self.progress_percent >= 100 and not self.completed_at:
            self.completed_at = timezone.now()
        self.save()


class LessonBookmark(TimeStampedModel):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="lesson_bookmarks")
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name="bookmarks")

    class Meta:
        db_table = "lesson_bookmarks"
        unique_together = ("user", "lesson")
        indexes = [models.Index(fields=["user", "lesson"])]
