from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.quizzes.views import QuizAttemptViewSet, QuizViewSet

router = DefaultRouter()
router.register("quizzes", QuizViewSet, basename="quizzes")
router.register("attempts", QuizAttemptViewSet, basename="quiz-attempts")

urlpatterns = [path("", include(router.urls))]
