from rest_framework import serializers

from apps.alerts.models import Notification, SecurityAlert


class SecurityAlertSerializer(serializers.ModelSerializer):
    visible = serializers.BooleanField(source="is_visible", read_only=True)

    class Meta:
        model = SecurityAlert
        fields = [
            "id",
            "title",
            "body",
            "priority",
            "alert_type",
            "audience_role",
            "starts_at",
            "expires_at",
            "is_active",
            "visible",
            "created_at",
            "updated_at",
        ]


class NotificationSerializer(serializers.ModelSerializer):
    alert = SecurityAlertSerializer(read_only=True)

    class Meta:
        model = Notification
        fields = ["id", "alert", "is_read", "read_at", "created_at"]
