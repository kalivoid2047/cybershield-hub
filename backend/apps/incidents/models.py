import uuid

from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel
from apps.common.validators import evidence_upload_path, validate_evidence_upload


class IncidentCategory(TimeStampedModel):
    name = models.CharField(max_length=140, unique=True)
    slug = models.SlugField(max_length=160, unique=True)
    description = models.TextField(blank=True)
    default_severity = models.CharField(max_length=24, default="medium")

    class Meta:
        db_table = "incident_categories"
        ordering = ["name"]

    def __str__(self):
        return self.name


class Incident(TimeStampedModel):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"
    SEVERITY_CHOICES = ((LOW, "Low"), (MEDIUM, "Medium"), (HIGH, "High"), (CRITICAL, "Critical"))

    OPEN = "open"
    INVESTIGATING = "investigating"
    ESCALATED = "escalated"
    RESOLVED = "resolved"
    CLOSED = "closed"
    STATUS_CHOICES = (
        (OPEN, "Open"),
        (INVESTIGATING, "Investigating"),
        (ESCALATED, "Escalated"),
        (RESOLVED, "Resolved"),
        (CLOSED, "Closed"),
    )

    reference_number = models.CharField(max_length=32, unique=True, editable=False)
    title = models.CharField(max_length=220)
    category = models.ForeignKey(IncidentCategory, on_delete=models.PROTECT, related_name="incidents")
    severity = models.CharField(max_length=24, choices=SEVERITY_CHOICES, default=MEDIUM, db_index=True)
    description = models.TextField()
    affected_system = models.CharField(max_length=180, blank=True)
    occurred_at = models.DateTimeField()
    reporter = models.ForeignKey("users.User", on_delete=models.PROTECT, related_name="reported_incidents")
    assigned_to = models.ForeignKey("users.User", on_delete=models.SET_NULL, related_name="assigned_incidents", null=True, blank=True)
    status = models.CharField(max_length=24, choices=STATUS_CHOICES, default=OPEN, db_index=True)
    priority_score = models.PositiveIntegerField(default=50)
    is_draft = models.BooleanField(default=False, db_index=True)
    submitted_at = models.DateTimeField(blank=True, null=True)
    resolved_at = models.DateTimeField(blank=True, null=True)
    closed_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "incidents"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["reference_number"]),
            models.Index(fields=["status", "severity"]),
            models.Index(fields=["reporter", "created_at"]),
            models.Index(fields=["assigned_to", "status"]),
        ]

    def save(self, *args, **kwargs):
        if not self.reference_number:
            stamp = timezone.now().strftime("%Y%m%d")
            self.reference_number = f"INC-{stamp}-{uuid.uuid4().hex[:6].upper()}"
        if not self.submitted_at and not self.is_draft:
            self.submitted_at = timezone.now()
        self.priority_score = self.calculate_priority()
        super().save(*args, **kwargs)

    def calculate_priority(self):
        severity_weight = {self.LOW: 25, self.MEDIUM: 50, self.HIGH: 75, self.CRITICAL: 95}
        status_weight = {self.OPEN: 5, self.INVESTIGATING: 10, self.ESCALATED: 15, self.RESOLVED: -20, self.CLOSED: -30}
        return max(0, min(100, severity_weight.get(self.severity, 50) + status_weight.get(self.status, 0)))

    def __str__(self):
        return f"{self.reference_number} - {self.title}"


class IncidentAttachment(TimeStampedModel):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name="attachments")
    file = models.FileField(upload_to=evidence_upload_path, validators=[validate_evidence_upload])
    original_name = models.CharField(max_length=255)
    content_type = models.CharField(max_length=120, blank=True)
    size = models.PositiveIntegerField(default=0)
    uploaded_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True)

    class Meta:
        db_table = "incident_attachments"
        indexes = [models.Index(fields=["incident", "created_at"])]


class IncidentUpdate(TimeStampedModel):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name="updates")
    actor = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, related_name="incident_updates")
    status_from = models.CharField(max_length=24, blank=True)
    status_to = models.CharField(max_length=24, blank=True)
    note = models.TextField()
    is_internal = models.BooleanField(default=False)

    class Meta:
        db_table = "incident_updates"
        ordering = ["created_at"]
        indexes = [models.Index(fields=["incident", "created_at"])]


class IncidentAssignment(TimeStampedModel):
    incident = models.ForeignKey(Incident, on_delete=models.CASCADE, related_name="assignments")
    assigned_to = models.ForeignKey("users.User", on_delete=models.PROTECT, related_name="incident_assignments")
    assigned_by = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, related_name="made_incident_assignments")
    note = models.TextField(blank=True)

    class Meta:
        db_table = "incident_assignments"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["assigned_to", "created_at"])]
