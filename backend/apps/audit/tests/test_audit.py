import pytest
from django.urls import reverse

from apps.audit.models import AuditLog

pytestmark = pytest.mark.django_db


class TestAuditLogMiddleware:
    def test_mutating_authenticated_request_writes_an_audit_log(self, user_client, incident_category):
        user_client.post(
            reverse("incidents-list"),
            {
                "title": "Test incident",
                "category_id": incident_category.id,
                "severity": "low",
                "description": "desc",
                "occurred_at": "2026-08-01T10:00:00Z",
            },
            format="json",
        )

        assert AuditLog.objects.filter(action__icontains="POST").exists()

    def test_read_only_request_does_not_write_an_audit_log(self, user_client):
        AuditLog.objects.all().delete()

        user_client.get(reverse("lessons-list"))

        assert AuditLog.objects.count() == 0

    def test_anonymous_mutating_request_does_not_write_an_audit_log(self, api_client):
        api_client.post(reverse("register"), {}, format="json")
        assert AuditLog.objects.count() == 0

    def test_audit_log_model_is_immutable(self, admin_user):
        log = AuditLog.objects.create(actor=admin_user, action="POST test", resource_type="incidents")
        log.action = "changed"
        with pytest.raises(ValueError):
            log.save()
        with pytest.raises(ValueError):
            log.delete()


class TestAuditLogAccess:
    def test_normal_user_cannot_view_audit_logs(self, user_client):
        response = user_client.get(reverse("audit-logs-list"))
        assert response.status_code == 403

    def test_officer_can_view_audit_logs(self, officer_client, officer_user):
        AuditLog.objects.create(actor=officer_user, action="POST test", resource_type="incidents")

        response = officer_client.get(reverse("audit-logs-list"))

        assert response.status_code == 200
        assert response.json()["count"] == 1

    def test_export_returns_csv_content(self, officer_client, officer_user):
        AuditLog.objects.create(actor=officer_user, action="POST test", resource_type="incidents")

        response = officer_client.get(reverse("audit-logs-export"))

        assert response.status_code == 200
        assert response["Content-Type"] == "text/csv"
        assert b"created_at" in response.content
