from rest_framework import serializers

from apps.training.models import Lesson, LessonBookmark, LessonCategory, LessonProgress


class LessonCategorySerializer(serializers.ModelSerializer):
    lesson_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = LessonCategory
        fields = ["id", "name", "slug", "description", "icon", "color", "order", "lesson_count", "created_at", "updated_at"]


class LessonSerializer(serializers.ModelSerializer):
    category = LessonCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=LessonCategory.objects.all(), source="category", write_only=True)
    progress_percent = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    quizzes = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            "id",
            "category",
            "category_id",
            "title",
            "slug",
            "summary",
            "content",
            "media_url",
            "estimated_minutes",
            "difficulty",
            "tags",
            "is_published",
            "recommended_for_roles",
            "progress_percent",
            "is_bookmarked",
            "quizzes",
            "created_at",
            "updated_at",
        ]

    def get_quizzes(self, obj):
        quizzes = getattr(obj, "active_quizzes", None)
        if quizzes is None:
            quizzes = obj.quizzes.filter(is_active=True)
        return [{"id": quiz.id, "title": quiz.title, "slug": quiz.slug} for quiz in quizzes]

    def get_progress_percent(self, obj):
        user = self.context["request"].user
        if not user.is_authenticated:
            return 0
        progress = getattr(obj, "user_progress", None)
        if progress:
            return progress[0].progress_percent if progress else 0
        item = LessonProgress.objects.filter(user=user, lesson=obj).first()
        return item.progress_percent if item else 0

    def get_is_bookmarked(self, obj):
        user = self.context["request"].user
        if not user.is_authenticated:
            return False
        return LessonBookmark.objects.filter(user=user, lesson=obj).exists()


class LessonProgressSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer(read_only=True)
    lesson_id = serializers.PrimaryKeyRelatedField(queryset=Lesson.objects.all(), source="lesson", write_only=True)

    class Meta:
        model = LessonProgress
        fields = ["id", "lesson", "lesson_id", "progress_percent", "completed_at", "last_viewed_at", "created_at", "updated_at"]
        read_only_fields = ["completed_at", "last_viewed_at", "created_at", "updated_at"]

    def validate_progress_percent(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Progress must be between 0 and 100.")
        return value


class LessonBookmarkSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer(read_only=True)

    class Meta:
        model = LessonBookmark
        fields = ["id", "lesson", "created_at"]
