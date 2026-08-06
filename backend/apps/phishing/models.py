from django.db import models

from apps.common.models import TimeStampedModel


class PhishingSimulation(TimeStampedModel):
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    DIFFICULTY_CHOICES = ((EASY, "Easy"), (MEDIUM, "Medium"), (HARD, "Hard"))

    title = models.CharField(max_length=220)
    scenario = models.TextField()
    difficulty = models.CharField(max_length=24, choices=DIFFICULTY_CHOICES, default=EASY)
    sender_name = models.CharField(max_length=160)
    sender_email = models.EmailField()
    subject = models.CharField(max_length=255)
    body = models.TextField()
    urls = models.JSONField(default=list, blank=True)
    red_flags = models.JSONField(default=list, blank=True)
    is_phishing = models.BooleanField(default=True)
    training_tip = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_phishing_sims")

    class Meta:
        db_table = "phishing_simulations"
        ordering = ["difficulty", "title"]
        indexes = [models.Index(fields=["difficulty", "is_active"])]

    def __str__(self):
        return self.title


class PhishingAttempt(TimeStampedModel):
    SAFE = "safe"
    SUSPICIOUS = "suspicious"
    CLASSIFICATION_CHOICES = ((SAFE, "Safe"), (SUSPICIOUS, "Suspicious"))

    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="phishing_attempts")
    simulation = models.ForeignKey(PhishingSimulation, on_delete=models.CASCADE, related_name="attempts")
    classification = models.CharField(max_length=24, choices=CLASSIFICATION_CHOICES)
    inspected_urls = models.JSONField(default=list, blank=True)
    selected_flags = models.JSONField(default=list, blank=True)
    correct = models.BooleanField(default=False)
    score = models.PositiveIntegerField(default=0)
    feedback = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "phishing_attempts"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "simulation", "created_at"]),
            models.Index(fields=["correct", "score"]),
        ]
