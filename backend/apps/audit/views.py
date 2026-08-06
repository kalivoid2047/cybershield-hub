import csv

from django.http import HttpResponse
from rest_framework import viewsets
from rest_framework.decorators import action

from apps.audit.models import AuditLog
from apps.audit.serializers import AuditLogSerializer
from apps.common.permissions import IsCyberOfficer


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related("actor", "actor__role").all()
    serializer_class = AuditLogSerializer
    permission_classes = [IsCyberOfficer]
    filterset_fields = ["action", "resource_type", "actor"]
    search_fields = ["actor__email", "action", "resource_type", "resource_id", "ip_address"]
    ordering_fields = ["created_at", "action", "resource_type"]

    @action(detail=False, methods=["get"])
    def export(self, request):
        response = HttpResponse(content_type="text/csv")
        response["Content-Disposition"] = 'attachment; filename="audit_logs.csv"'
        writer = csv.writer(response)
        writer.writerow(["created_at", "actor", "action", "resource_type", "resource_id", "ip_address"])
        for log in self.filter_queryset(self.get_queryset())[:5000]:
            writer.writerow([log.created_at, log.actor.email if log.actor else "", log.action, log.resource_type, log.resource_id, log.ip_address])
        return response
