from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.training.views import LessonBookmarkViewSet, LessonCategoryViewSet, LessonProgressViewSet, LessonViewSet

router = DefaultRouter()
router.register("categories", LessonCategoryViewSet, basename="lesson-categories")
router.register("lessons", LessonViewSet, basename="lessons")
router.register("progress", LessonProgressViewSet, basename="lesson-progress")
router.register("bookmarks", LessonBookmarkViewSet, basename="lesson-bookmarks")

urlpatterns = [path("", include(router.urls))]
