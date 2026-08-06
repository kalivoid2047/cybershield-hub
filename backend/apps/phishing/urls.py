from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.phishing.views import PhishingAttemptViewSet, PhishingSimulationViewSet

router = DefaultRouter()
router.register("simulations", PhishingSimulationViewSet, basename="phishing-simulations")
router.register("attempts", PhishingAttemptViewSet, basename="phishing-attempts")

urlpatterns = [path("", include(router.urls))]
