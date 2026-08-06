from rest_framework import serializers

from apps.audit.models import AuditLog
from apps.users.serializers import UserSerializer


class AuditLogSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = AuditLog
        fields = ["id", "actor", "action", "resource_type", "resource_id", "ip_address", "user_agent", "metadata", "created_at"]
        read_only_fields = fields
