from django.db.models import Count
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser

from apps.common.permissions import IsAdminOrReadOnly, IsSystemAdmin, IsOwnerOrAdmin
from apps.common.responses import ok
from apps.incidents.models import Incident, IncidentAssignment, IncidentCategory, IncidentUpdate
from apps.incidents.serializers import (
    IncidentAssignSerializer,
    IncidentAssignmentSerializer,
    IncidentCategorySerializer,
    IncidentCreateUpdateSerializer,
    IncidentDetailSerializer,
    IncidentListSerializer,
    IncidentTransitionSerializer,
    IncidentUpdateSerializer,
)
from apps.users.models import Role, User


class IncidentCategoryViewSet(viewsets.ModelViewSet):
    queryset = IncidentCategory.objects.all()
    serializer_class = IncidentCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ["name", "description"]
    ordering_fields = ["name", "created_at"]


class IncidentViewSet(viewsets.ModelViewSet):
    parser_classes = [MultiPartParser, FormParser, JSONParser]
    permission_classes = [IsOwnerOrAdmin]
    filterset_fields = ["status", "severity", "category", "assigned_to", "is_draft"]
    search_fields = ["reference_number", "title", "description", "affected_system", "reporter__email", "assigned_to__email"]
    ordering_fields = ["created_at", "updated_at", "priority_score", "occurred_at"]

    def get_queryset(self):
        qs = Incident.objects.select_related("category", "reporter", "reporter__role", "assigned_to", "assigned_to__role").prefetch_related(
            "attachments", "updates", "updates__actor"
        ).annotate(attachment_count=Count("attachments")).order_by("-created_at", "-id")
        if self.request.user.role_code in {Role.SYSTEM_ADMIN}:
            return qs
        return qs.filter(reporter=self.request.user)

    def get_serializer_class(self):
        if self.action in {"create", "update", "partial_update"}:
            return IncidentCreateUpdateSerializer
        if self.action == "retrieve":
            return IncidentDetailSerializer
        return IncidentListSerializer

    def get_permissions(self):
        if self.action in {"assign", "transition", "queue", "heatmap"}:
            return [IsSystemAdmin()]
        if self.action == "create":
            return [permissions.IsAuthenticated()]
        return super().get_permissions()

    @action(detail=True, methods=["post"])
    def submit(self, request, pk=None):
        incident = self.get_object()
        incident.is_draft = False
        incident.submitted_at = incident.submitted_at or timezone.now()
        incident.save(update_fields=["is_draft", "submitted_at", "priority_score", "updated_at"])
        IncidentUpdate.objects.create(incident=incident, actor=request.user, status_to=incident.status, note="Incident submitted.")
        return ok(IncidentDetailSerializer(incident, context={"request": request}).data, "Incident submitted.")

    @action(detail=True, methods=["post"])
    def assign(self, request, pk=None):
        incident = self.get_object()
        serializer = IncidentAssignSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        officer = User.objects.filter(
            id=serializer.validated_data["officer_id"],
            role__code=Role.SYSTEM_ADMIN,
            is_active=True,
        ).first()
        if not officer:
            raise ValidationError({"officer_id": "Officer not found."})
        incident.assigned_to = officer
        if incident.status == Incident.OPEN:
            incident.status = Incident.INVESTIGATING
        incident.save(update_fields=["assigned_to", "status", "priority_score", "updated_at"])
        assignment = IncidentAssignment.objects.create(
            incident=incident,
            assigned_to=officer,
            assigned_by=request.user,
            note=serializer.validated_data.get("note", ""),
        )
        IncidentUpdate.objects.create(
            incident=incident,
            actor=request.user,
            status_to=incident.status,
            note=f"Assigned to {officer.email}. {assignment.note}".strip(),
            is_internal=True,
        )
        return ok(IncidentAssignmentSerializer(assignment, context={"request": request}).data, "Incident assigned.")

    @action(detail=True, methods=["post"])
    def transition(self, request, pk=None):
        incident = self.get_object()
        serializer = IncidentTransitionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        old_status = incident.status
        incident.status = serializer.validated_data["status"]
        if incident.status == Incident.RESOLVED:
            incident.resolved_at = timezone.now()
        if incident.status == Incident.CLOSED:
            incident.closed_at = timezone.now()
        incident.save()
        update = IncidentUpdate.objects.create(
            incident=incident,
            actor=request.user,
            status_from=old_status,
            status_to=incident.status,
            note=serializer.validated_data["note"],
            is_internal=serializer.validated_data["is_internal"],
        )
        return ok(IncidentUpdateSerializer(update, context={"request": request}).data, "Incident status updated.")

    @action(detail=False, methods=["get"])
    def queue(self, request):
        grouped = {}
        for status_value, _ in Incident.STATUS_CHOICES:
            grouped[status_value] = IncidentListSerializer(
                self.get_queryset().filter(status=status_value).order_by("-priority_score", "-created_at")[:50],
                many=True,
                context={"request": request},
            ).data
        return ok(grouped)

    @action(detail=False, methods=["get"])
    def heatmap(self, request):
        rows = self.get_queryset().values("severity", "status").annotate(count=Count("id"))
        return ok(list(rows))


class IncidentUpdateViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IncidentUpdateSerializer
    permission_classes = [IsOwnerOrAdmin]

    def get_queryset(self):
        qs = IncidentUpdate.objects.select_related("incident", "actor")
        if self.request.user.role_code in {Role.SYSTEM_ADMIN}:
            return qs
        return qs.filter(incident__reporter=self.request.user, is_internal=False)


class IncidentAssignmentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IncidentAssignmentSerializer
    permission_classes = [IsSystemAdmin]
    filterset_fields = ["assigned_to", "incident"]

    def get_queryset(self):
        return IncidentAssignment.objects.select_related("incident", "assigned_to", "assigned_by")
