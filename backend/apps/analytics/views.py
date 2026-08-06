from datetime import timedelta

from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.views import APIView

from apps.alerts.models import Notification, SecurityAlert
from apps.common.permissions import IsCyberOfficer
from apps.common.responses import ok
from apps.incidents.models import Incident
from apps.phishing.models import PhishingAttempt
from apps.quizzes.models import QuizAttempt
from apps.training.models import Lesson, LessonProgress
from apps.users.models import User


class UserDashboardAnalyticsView(APIView):
    def get(self, request):
        user = request.user
        total_lessons = Lesson.objects.filter(is_published=True).count()
        completed_lessons = LessonProgress.objects.filter(user=user, completed_at__isnull=False).count()
        avg_quiz = QuizAttempt.objects.filter(user=user, completed_at__isnull=False).aggregate(value=Avg("score"))["value"] or 0
        phishing_avg = PhishingAttempt.objects.filter(user=user).aggregate(value=Avg("score"))["value"] or 0
        open_incidents = Incident.objects.filter(reporter=user).exclude(status__in=[Incident.RESOLVED, Incident.CLOSED]).count()
        unread = Notification.objects.filter(user=user, is_read=False).count()
        security_score = round((completed_lessons / total_lessons * 35 if total_lessons else 0) + (float(avg_quiz) * 0.35) + (float(phishing_avg) * 0.2) + max(0, 10 - open_incidents * 2), 0)
        user.security_score = min(100, int(security_score))
        user.save(update_fields=["security_score"])
        return ok(
            {
                "security_score": user.security_score,
                "learning_progress": {"completed": completed_lessons, "total": total_lessons},
                "quiz_average": round(float(avg_quiz), 2),
                "phishing_average": round(float(phishing_avg), 2),
                "open_incidents": open_incidents,
                "unread_notifications": unread,
            }
        )


class OrganizationAnalyticsView(APIView):
    permission_classes = [IsCyberOfficer]

    def get(self, request):
        now = timezone.now()
        thirty_days_ago = now - timedelta(days=30)
        users = User.objects.filter(is_active=True).count()
        completed = LessonProgress.objects.filter(completed_at__isnull=False).count()
        total_progress = LessonProgress.objects.count()
        quiz_avg = QuizAttempt.objects.filter(completed_at__isnull=False).aggregate(value=Avg("score"))["value"] or 0
        phishing_avg = PhishingAttempt.objects.aggregate(value=Avg("score"))["value"] or 0
        incidents_30d = Incident.objects.filter(created_at__gte=thirty_days_ago).count()
        critical_open = Incident.objects.filter(severity=Incident.CRITICAL).exclude(status__in=[Incident.RESOLVED, Incident.CLOSED]).count()
        risk_score = min(100, max(0, int(100 - float(quiz_avg) * 0.25 - float(phishing_avg) * 0.25 + incidents_30d * 2 + critical_open * 8)))
        return ok(
            {
                "active_users": users,
                "training_completion_rate": round((completed / total_progress) * 100, 2) if total_progress else 0,
                "quiz_average": round(float(quiz_avg), 2),
                "phishing_average": round(float(phishing_avg), 2),
                "incidents_30d": incidents_30d,
                "critical_open": critical_open,
                "organization_risk_score": risk_score,
            }
        )


class ChartAnalyticsView(APIView):
    permission_classes = [IsCyberOfficer]

    def get(self, request):
        incident_trends = (
            Incident.objects.annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        severity = Incident.objects.values("severity").annotate(count=Count("id"))
        quiz_by_pass = QuizAttempt.objects.values("passed").annotate(count=Count("id"), avg_score=Avg("score"))
        phishing = PhishingAttempt.objects.values("correct").annotate(count=Count("id"), avg_score=Avg("score"))
        training_by_category = (
            LessonProgress.objects.filter(completed_at__isnull=False)
            .values("lesson__category__name")
            .annotate(count=Count("id"))
            .order_by("lesson__category__name")
        )
        engagement = User.objects.annotate(
            lessons=Count("lesson_progress", filter=Q(lesson_progress__completed_at__isnull=False)),
            quizzes=Count("quiz_attempts"),
            phishing=Count("phishing_attempts"),
        ).aggregate(
            avg_lessons=Avg("lessons"),
            avg_quizzes=Avg("quizzes"),
            avg_phishing=Avg("phishing"),
        )
        return ok(
            {
                "incident_trends": list(incident_trends),
                "incident_severity": list(severity),
                "quiz_performance": list(quiz_by_pass),
                "phishing_awareness": list(phishing),
                "training_by_category": list(training_by_category),
                "engagement": engagement,
                "active_alerts": SecurityAlert.objects.filter(is_active=True).count(),
            }
        )
