from django.db import models


class AuditLog(models.Model):
    actor = models.ForeignKey("users.User", on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_logs")
    action = models.CharField(max_length=120, db_index=True)
    resource_type = models.CharField(max_length=120, blank=True, db_index=True)
    resource_id = models.CharField(max_length=80, blank=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "audit_logs"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["actor", "created_at"]),
            models.Index(fields=["action", "resource_type"]),
        ]

    def save(self, *args, **kwargs):
        if self.pk:
            raise ValueError("Audit logs are immutable and cannot be updated.")
        super().save(*args, **kwargs)

    def delete(self, *args, **kwargs):
        raise ValueError("Audit logs are immutable and cannot be deleted.")

    def __str__(self):
        return f"{self.action} {self.resource_type} by {self.actor_id}"
