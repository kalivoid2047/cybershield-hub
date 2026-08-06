from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.alerts.views import NotificationViewSet, SecurityAlertViewSet

router = DefaultRouter()
router.register("alerts", SecurityAlertViewSet, basename="security-alerts")
router.register("notifications", NotificationViewSet, basename="notifications")

urlpatterns = [path("", include(router.urls))]
