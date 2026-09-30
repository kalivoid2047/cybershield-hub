import pytest
from django.urls import reverse

from apps.quizzes.models import QuizAttempt
from apps.training.models import LessonProgress

pytestmark = pytest.mark.django_db


class TestUserDashboardAnalytics:
    def test_requires_authentication(self, api_client):
        response = api_client.get(reverse("analytics-me"))
        assert response.status_code == 401

    def test_returns_baseline_metrics_for_new_user(self, user_client):
        response = user_client.get(reverse("analytics-me"))

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["learning_progress"]["completed"] == 0
        assert data["open_incidents"] == 0

    def test_completed_lesson_counts_toward_progress(self, user_client, normal_user, published_lesson):
        progress = LessonProgress.objects.create(user=normal_user, lesson=published_lesson)
        progress.mark_progress(100)

        response = user_client.get(reverse("analytics-me"))

        assert response.json()["data"]["learning_progress"]["completed"] == 1

    def test_endpoint_updates_stored_security_score(self, user_client, normal_user):
        user_client.get(reverse("analytics-me"))
        normal_user.refresh_from_db()
        assert isinstance(normal_user.security_score, int)


class TestOrganizationAnalytics:
    def test_normal_user_forbidden(self, user_client):
        response = user_client.get(reverse("analytics-organization"))
        assert response.status_code == 403

    def test_officer_can_view_organization_metrics(self, officer_client):
        response = officer_client.get(reverse("analytics-organization"))

        assert response.status_code == 200
        data = response.json()["data"]
        assert "organization_risk_score" in data
        assert "active_users" in data


class TestChartAnalytics:
    def test_normal_user_forbidden(self, user_client):
        response = user_client.get(reverse("analytics-charts"))
        assert response.status_code == 403

    def test_officer_receives_chart_payload_shape(self, officer_client, quiz, normal_user):
        QuizAttempt.objects.create(user=normal_user, quiz=quiz, score=90, passed=True, completed_at="2026-08-01T10:00:00Z")

        response = officer_client.get(reverse("analytics-charts"))

        assert response.status_code == 200
        data = response.json()["data"]
        for key in ["incident_trends", "incident_severity", "quiz_performance", "phishing_awareness", "training_by_category", "engagement"]:
            assert key in data


class TestTrainingCompletionRate:
    def test_rate_is_out_of_all_lessons_each_active_user_could_finish(self, officer_client, published_lesson, normal_user, officer_user):
        from apps.training.models import LessonProgress

        LessonProgress.objects.create(user=normal_user, lesson=published_lesson).mark_progress(100)

        data = officer_client.get(reverse("analytics-organization")).json()["data"]

        # 2 active users x 1 published lesson = 2 possible completions, 1 achieved.
        assert data["training_completion_rate"] == 50.0

    def test_started_but_unfinished_lessons_do_not_inflate_the_rate(self, officer_client, published_lesson, normal_user):
        from apps.training.models import LessonProgress

        LessonProgress.objects.create(user=normal_user, lesson=published_lesson).mark_progress(40)

        data = officer_client.get(reverse("analytics-organization")).json()["data"]

        assert data["training_completion_rate"] == 0
