import re

from rest_framework import serializers

from apps.common.slugs import unique_slug
from apps.training.models import Lesson, LessonBookmark, LessonCategory, LessonProgress


class LessonCategorySerializer(serializers.ModelSerializer):
    lesson_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = LessonCategory
        extra_kwargs = {"slug": {"required": False}}
        fields = ["id", "name", "slug", "description", "icon", "color", "order", "lesson_count", "created_at", "updated_at"]

    def validate_name(self, value):
        value = value.strip()
        if not value:
            raise serializers.ValidationError("Give the category a name.")
        return value

    def validate_color(self, value):
        if not re.fullmatch(r"#[0-9a-fA-F]{6}", value or ""):
            raise serializers.ValidationError("Use a hex colour such as #38bdf8.")
        return value

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = unique_slug(LessonCategory, validated_data["name"], max_length=140, fallback="category")
        return super().create(validated_data)


class LessonSerializer(serializers.ModelSerializer):
    category = LessonCategorySerializer(read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(queryset=LessonCategory.objects.all(), source="category", write_only=True)
    progress_percent = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    quizzes = serializers.SerializerMethodField()
    quiz_required = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        extra_kwargs = {"slug": {"required": False}}
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
            "quiz_required",
            "created_at",
            "updated_at",
        ]

    def validate_tags(self, value):
        if not isinstance(value, list) or not all(isinstance(tag, str) for tag in value):
            raise serializers.ValidationError("Tags must be a list of text values.")
        return [tag.strip() for tag in value if tag.strip()][:20]

    def validate_recommended_for_roles(self, value):
        if not isinstance(value, list) or not all(isinstance(role, str) for role in value):
            raise serializers.ValidationError("Roles must be a list of role codes.")
        return value

    def create(self, validated_data):
        if not validated_data.get("slug"):
            validated_data["slug"] = unique_slug(Lesson, validated_data["title"], max_length=240, fallback="lesson")
        return super().create(validated_data)

    def get_quizzes(self, obj):
        quizzes = getattr(obj, "active_quizzes", None)
        if quizzes is None:
            quizzes = obj.quizzes.filter(is_active=True)
        return [{"id": quiz.id, "title": quiz.title, "slug": quiz.slug} for quiz in quizzes]

    def get_quiz_required(self, obj):
        """True while the learner still has to finish a quiz attempt before completing the lesson."""
        user = self.context["request"].user
        if not user.is_authenticated:
            return False
        quizzes = getattr(obj, "active_quizzes", None)
        if quizzes is not None and not quizzes:
            return False  # skip the queries for lessons without a quiz
        return obj.quiz_required_for(user)

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

    def validate(self, attrs):
        # Direct create/update through the progress viewset must not bypass the quiz requirement.
        lesson = attrs.get("lesson") or (self.instance.lesson if self.instance else None)
        percent = attrs.get("progress_percent", self.instance.progress_percent if self.instance else 0)
        user = self.context["request"].user
        if lesson and percent >= 100 and lesson.quiz_required_for(user):
            raise serializers.ValidationError({"detail": "Take the lesson quiz before marking this lesson complete."})
        return attrs


class LessonBookmarkSerializer(serializers.ModelSerializer):
    lesson = LessonSerializer(read_only=True)

    class Meta:
        model = LessonBookmark
        fields = ["id", "lesson", "created_at"]
