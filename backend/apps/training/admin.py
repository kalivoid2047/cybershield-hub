from django.contrib import admin

from apps.training.models import Lesson, LessonBookmark, LessonCategory, LessonProgress


@admin.register(LessonCategory)
class LessonCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "order", "created_at")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "description")


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "difficulty", "is_published", "estimated_minutes", "updated_at")
    list_filter = ("category", "difficulty", "is_published")
    prepopulated_fields = {"slug": ("title",)}
    search_fields = ("title", "summary", "content")


admin.site.register(LessonProgress)
admin.site.register(LessonBookmark)
