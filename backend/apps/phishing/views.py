from django.db.models import Count, Max
from rest_framework import permissions, viewsets
from rest_framework.decorators import action

from apps.common.permissions import IsAdminOrReadOnly, IsOwnerOrAdmin
from apps.common.responses import ok
from apps.phishing.models import PhishingAttempt, PhishingSimulation
from apps.phishing.serializers import PhishingAttemptSerializer, PhishingSimulationSerializer, SubmitPhishingAttemptSerializer
from apps.phishing.services import grade_phishing_attempt


class PhishingSimulationViewSet(viewsets.ModelViewSet):
    serializer_class = PhishingSimulationSerializer
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["difficulty", "is_active", "is_phishing"]
    search_fields = ["title", "scenario", "sender_email", "subject", "body"]
    ordering_fields = ["title", "difficulty", "created_at"]

    def get_queryset(self):
        qs = PhishingSimulation.objects.annotate(attempt_count=Count("attempts"), latest_score=Max("attempts__score")).order_by("difficulty", "title", "id")
        if self.request.method == "GET" and not self.request.user.is_staff:
            qs = qs.filter(is_active=True)
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        simulation = self.get_object()
        serializer = SubmitPhishingAttemptSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attempt = PhishingAttempt.objects.create(
            user=request.user,
            simulation=simulation,
            classification=serializer.validated_data["classification"],
            inspected_urls=serializer.validated_data.get("inspected_urls", []),
            selected_flags=serializer.validated_data.get("selected_flags", []),
        )
        grade_phishing_attempt(attempt)
        return ok(PhishingAttemptSerializer(attempt, context={"request": request}).data, "Simulation submitted.")


class PhishingAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PhishingAttemptSerializer
    permission_classes = [IsOwnerOrAdmin]
    filterset_fields = ["simulation", "correct"]
    ordering_fields = ["score", "created_at"]

    def get_queryset(self):
        qs = PhishingAttempt.objects.select_related("simulation", "user")
        if self.request.user.role_code == "system_admin":
            return qs
        return qs.filter(user=self.request.user)
