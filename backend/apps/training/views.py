from django.db.models import Count, Prefetch
from rest_framework import permissions, viewsets
from rest_framework.decorators import action

from apps.common.permissions import IsAdminOrReadOnly
from apps.common.responses import ok
from apps.training.models import Lesson, LessonBookmark, LessonCategory, LessonProgress
from apps.training.serializers import LessonBookmarkSerializer, LessonCategorySerializer, LessonProgressSerializer, LessonSerializer


class LessonCategoryViewSet(viewsets.ModelViewSet):
    queryset = LessonCategory.objects.annotate(lesson_count=Count("lessons"))
    serializer_class = LessonCategorySerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ["name", "description"]
    ordering_fields = ["order", "name", "created_at"]


class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsAdminOrReadOnly]
    lookup_field = "slug"
    filterset_fields = ["category__slug", "difficulty", "is_published"]
    search_fields = ["title", "summary", "content", "tags"]
    ordering_fields = ["title", "estimated_minutes", "created_at", "updated_at"]

    def get_queryset(self):
        qs = Lesson.objects.select_related("category", "created_by")
        user = self.request.user
        if not (user.is_authenticated and (user.is_staff or user.role_code == "system_admin")):
            qs = qs.filter(is_published=True)
        if user.is_authenticated:
            qs = qs.prefetch_related(
                Prefetch("progress", queryset=LessonProgress.objects.filter(user=user), to_attr="user_progress")
            )
        return qs

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"])
    def recommended(self, request):
        user = request.user
        completed_ids = LessonProgress.objects.filter(user=user, completed_at__isnull=False).values_list("lesson_id", flat=True)
        # JSONField __contains is unsupported on SQLite, so match roles in Python.
        candidates = self.get_queryset().exclude(id__in=completed_ids)
        lessons = [
            lesson
            for lesson in candidates
            if lesson.difficulty == Lesson.BEGINNER or user.role_code in (lesson.recommended_for_roles or [])
        ][:8]
        return ok(LessonSerializer(lessons, many=True, context={"request": request}).data)

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def progress(self, request, slug=None):
        lesson = self.get_object()
        progress, _ = LessonProgress.objects.get_or_create(user=request.user, lesson=lesson)
        serializer = LessonProgressSerializer(progress, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        progress.mark_progress(serializer.validated_data.get("progress_percent", progress.progress_percent))
        return ok(LessonProgressSerializer(progress, context={"request": request}).data, "Progress updated.")

    @action(detail=True, methods=["post"], permission_classes=[permissions.IsAuthenticated])
    def complete(self, request, slug=None):
        lesson = self.get_object()
        progress, _ = LessonProgress.objects.get_or_create(user=request.user, lesson=lesson)
        progress.mark_progress(100)
        return ok(LessonProgressSerializer(progress, context={"request": request}).data, "Lesson completed.")

    @action(detail=True, methods=["post", "delete"], permission_classes=[permissions.IsAuthenticated])
    def bookmark(self, request, slug=None):
        lesson = self.get_object()
        if request.method == "DELETE":
            LessonBookmark.objects.filter(user=request.user, lesson=lesson).delete()
            return ok(message="Bookmark removed.")
        bookmark, _ = LessonBookmark.objects.get_or_create(user=request.user, lesson=lesson)
        return ok(LessonBookmarkSerializer(bookmark, context={"request": request}).data, "Lesson bookmarked.")


class LessonProgressViewSet(viewsets.ModelViewSet):
    serializer_class = LessonProgressSerializer

    def get_queryset(self):
        return LessonProgress.objects.filter(user=self.request.user).select_related("lesson", "lesson__category")

    def perform_create(self, serializer):
        progress, _ = LessonProgress.objects.update_or_create(
            user=self.request.user,
            lesson=serializer.validated_data["lesson"],
            defaults={"progress_percent": serializer.validated_data.get("progress_percent", 0)},
        )
        progress.mark_progress(progress.progress_percent)
        serializer.instance = progress


class LessonBookmarkViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LessonBookmarkSerializer

    def get_queryset(self):
        return LessonBookmark.objects.filter(user=self.request.user).select_related("lesson", "lesson__category")
