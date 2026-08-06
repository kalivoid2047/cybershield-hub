from django.db.models import Count, Max, Q
from rest_framework import permissions, viewsets
from rest_framework.decorators import action

from apps.common.permissions import IsAdminOrReadOnly, IsOwnerOrOfficer
from apps.common.responses import ok
from apps.quizzes.models import Quiz, QuizAttempt
from apps.quizzes.serializers import QuizAdminSerializer, QuizAttemptSerializer, QuizDetailSerializer, QuizListSerializer, SubmitQuizSerializer
from apps.quizzes.services import grade_quiz_attempt


class QuizViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    filterset_fields = ["category", "lesson", "is_active"]
    search_fields = ["title", "description", "questions__prompt"]
    ordering_fields = ["title", "created_at", "time_limit_minutes"]

    def get_queryset(self):
        qs = Quiz.objects.annotate(question_count=Count("questions")).prefetch_related("questions__answers")
        if self.request.user.is_authenticated:
            qs = qs.annotate(best_score=Max("attempts__score", filter=Q(attempts__user=self.request.user)))
        if self.request.method == "GET" and not self.request.user.is_staff:
            qs = qs.filter(is_active=True)
        return qs

    def get_serializer_class(self):
        if self.request.method not in permissions.SAFE_METHODS:
            return QuizAdminSerializer
        if self.action == "retrieve":
            return QuizDetailSerializer
        return QuizListSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def start(self, request, pk=None):
        quiz = self.get_object()
        attempt = QuizAttempt.objects.create(user=request.user, quiz=quiz)
        return ok(QuizAttemptSerializer(attempt, context={"request": request}).data, "Quiz attempt started.")

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def submit(self, request, pk=None):
        quiz = self.get_object()
        serializer = SubmitQuizSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        attempt_id = request.data.get("attempt_id")
        if attempt_id:
            attempt = QuizAttempt.objects.get(id=attempt_id, user=request.user, quiz=quiz)
        else:
            attempt = QuizAttempt.objects.create(user=request.user, quiz=quiz)
        attempt = grade_quiz_attempt(attempt, serializer.validated_data["answers"])
        return ok(QuizAttemptSerializer(attempt, context={"request": request}).data, "Quiz graded.")

    @action(detail=True, methods=["get"], permission_classes=[permissions.IsAuthenticated])
    def attempts(self, request, pk=None):
        attempts = QuizAttempt.objects.filter(user=request.user, quiz=self.get_object()).prefetch_related("answers")
        return ok(QuizAttemptSerializer(attempts, many=True, context={"request": request}).data)


class QuizAttemptViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsOwnerOrOfficer]
    filterset_fields = ["quiz", "passed"]
    ordering_fields = ["score", "created_at", "completed_at"]

    def get_queryset(self):
        qs = QuizAttempt.objects.select_related("quiz", "user").prefetch_related("answers", "answers__question", "answers__selected_answer")
        if self.request.user.role_code in {"system_admin", "cybersecurity_officer"}:
            return qs
        return qs.filter(user=self.request.user)
