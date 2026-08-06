from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone

from apps.alerts.models import Notification, SecurityAlert

pytestmark = pytest.mark.django_db


class TestAlertCreationAndFanout:
    def test_admin_creating_alert_fans_out_notifications_to_active_users(self, admin_client, normal_user, officer_user):
        response = admin_client.post(
            reverse("security-alerts-list"),
            {
                "title": "Phishing wave detected",
                "body": "Multiple reports of a fake invoice email.",
                "priority": "high",
                "alert_type": "threat_advisory",
                "starts_at": timezone.now().isoformat(),
            },
            format="json",
        )

        assert response.status_code == 201
        alert = SecurityAlert.objects.get(id=response.json()["id"])
        assert Notification.objects.filter(alert=alert, user=normal_user).exists()
        assert Notification.objects.filter(alert=alert, user=officer_user).exists()

    def test_fanout_respects_audience_role(self, admin_client, normal_user, officer_user):
        response = admin_client.post(
            reverse("security-alerts-list"),
            {
                "title": "Officer-only advisory",
                "body": "Internal note.",
                "priority": "medium",
                "alert_type": "announcement",
                "audience_role": "cybersecurity_officer",
                "starts_at": timezone.now().isoformat(),
            },
            format="json",
        )

        alert = SecurityAlert.objects.get(id=response.json()["id"])
        assert Notification.objects.filter(alert=alert, user=officer_user).exists()
        assert not Notification.objects.filter(alert=alert, user=normal_user).exists()

    def test_normal_user_cannot_create_alerts(self, user_client):
        response = user_client.post(
            reverse("security-alerts-list"),
            {"title": "x", "body": "y", "starts_at": timezone.now().isoformat()},
            format="json",
        )
        assert response.status_code == 403


class TestAlertVisibility:
    def test_expired_alert_is_hidden_from_normal_users(self, user_client, admin_user):
        SecurityAlert.objects.create(
            title="Old advisory",
            body="Stale.",
            starts_at=timezone.now() - timedelta(days=10),
            expires_at=timezone.now() - timedelta(days=1),
            created_by=admin_user,
        )

        response = user_client.get(reverse("security-alerts-list"))

        assert response.json()["count"] == 0

    def test_active_alert_is_visible_to_normal_users(self, user_client, security_alert):
        response = user_client.get(reverse("security-alerts-list"))
        assert response.json()["count"] == 1


class TestNotifications:
    def test_user_only_sees_own_notifications(self, user_client, other_normal_user, api_client, security_alert, normal_user):
        Notification.objects.create(user=normal_user, alert=security_alert)
        Notification.objects.create(user=other_normal_user, alert=security_alert)

        response = user_client.get(reverse("notifications-list"))

        assert response.json()["count"] == 1

    def test_marking_a_notification_read_sets_timestamp(self, user_client, normal_user, security_alert):
        notification = Notification.objects.create(user=normal_user, alert=security_alert)

        response = user_client.post(reverse("notifications-read", args=[notification.id]))

        assert response.status_code == 200
        notification.refresh_from_db()
        assert notification.is_read is True
        assert notification.read_at is not None

    def test_read_all_marks_every_unread_notification(self, user_client, normal_user, security_alert, admin_user):
        alert_2 = SecurityAlert.objects.create(
            title="Second advisory", body="More detail.", starts_at=timezone.now(), created_by=admin_user
        )
        Notification.objects.create(user=normal_user, alert=security_alert)
        Notification.objects.create(user=normal_user, alert=alert_2)

        response = user_client.post(reverse("notifications-read-all"))

        assert response.status_code == 200
        assert Notification.objects.filter(user=normal_user, is_read=False).count() == 0
