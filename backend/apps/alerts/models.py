from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class SecurityAlert(TimeStampedModel):
    INFO = "info"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    PRIORITY_CHOICES = ((INFO, "Info"), (MEDIUM, "Medium"), (HIGH, "High"), (CRITICAL, "Critical"))

    ANNOUNCEMENT = "announcement"
    THREAT_ADVISORY = "threat_advisory"
    DAILY_TIP = "daily_tip"
    ALERT_TYPE_CHOICES = (
        (ANNOUNCEMENT, "Announcement"),
        (THREAT_ADVISORY, "Threat Advisory"),
        (DAILY_TIP, "Daily Cyber Tip"),
    )

    title = models.CharField(max_length=220)
    body = models.TextField()
    priority = models.CharField(max_length=24, choices=PRIORITY_CHOICES, default=INFO, db_index=True)
    alert_type = models.CharField(max_length=32, choices=ALERT_TYPE_CHOICES, default=ANNOUNCEMENT)
    audience_role = models.CharField(max_length=40, blank=True, help_text="Blank means all roles.")
    starts_at = models.DateTimeField(default=timezone.now)
    expires_at = models.DateTimeField(blank=True, null=True)
    is_active = models.BooleanField(default=True, db_index=True)
    created_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="created_alerts")

    class Meta:
        db_table = "alerts"
        ordering = ["-priority", "-starts_at"]
        indexes = [models.Index(fields=["is_active", "starts_at", "expires_at"])]

    @property
    def is_visible(self):
        now = timezone.now()
        return self.is_active and self.starts_at <= now and (self.expires_at is None or self.expires_at >= now)

    def __str__(self):
        return self.title


class Notification(TimeStampedModel):
    user = models.ForeignKey("users.User", on_delete=models.CASCADE, related_name="notifications")
    alert = models.ForeignKey(SecurityAlert, on_delete=models.CASCADE, related_name="notifications")
    is_read = models.BooleanField(default=False, db_index=True)
    read_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "notifications"
        unique_together = ("user", "alert")
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["user", "is_read"])]

    def mark_read(self):
        self.is_read = True
        self.read_at = timezone.now()
        self.save(update_fields=["is_read", "read_at"])
