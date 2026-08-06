from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action

from apps.alerts.models import Notification, SecurityAlert
from apps.alerts.serializers import NotificationSerializer, SecurityAlertSerializer
from apps.common.permissions import IsAdminOrReadOnly
from apps.common.responses import ok


class SecurityAlertViewSet(viewsets.ModelViewSet):
    serializer_class = SecurityAlertSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["priority", "alert_type", "is_active", "audience_role"]
    search_fields = ["title", "body"]
    ordering_fields = ["starts_at", "expires_at", "priority", "created_at"]

    def get_queryset(self):
        qs = SecurityAlert.objects.all()
        if self.request.method == "GET" and not self.request.user.is_staff:
            now = timezone.now()
            qs = qs.filter(is_active=True, starts_at__lte=now).filter(Q(expires_at__isnull=True) | Q(expires_at__gte=now))
            role = self.request.user.role_code
            qs = qs.filter(Q(audience_role="") | Q(audience_role=role))
        return qs

    def perform_create(self, serializer):
        alert = serializer.save(created_by=self.request.user)
        self._fanout(alert)

    def _fanout(self, alert):
        from apps.users.models import User

        users = User.objects.filter(is_active=True)
        if alert.audience_role:
            users = users.filter(role__code=alert.audience_role)
        Notification.objects.bulk_create(
            [Notification(user=user, alert=alert) for user in users],
            ignore_conflicts=True,
        )


class NotificationViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = NotificationSerializer
    filterset_fields = ["is_read", "alert__priority", "alert__alert_type"]
    ordering_fields = ["created_at", "read_at"]

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user).select_related("alert")

    @action(detail=True, methods=["post"])
    def read(self, request, pk=None):
        notification = self.get_object()
        notification.mark_read()
        return ok(NotificationSerializer(notification, context={"request": request}).data, "Notification marked read.")

    @action(detail=False, methods=["post"])
    def read_all(self, request):
        self.get_queryset().filter(is_read=False).update(is_read=True, read_at=timezone.now())
        return ok(message="All notifications marked read.")
