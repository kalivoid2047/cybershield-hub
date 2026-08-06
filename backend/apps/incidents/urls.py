from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.incidents.views import IncidentAssignmentViewSet, IncidentCategoryViewSet, IncidentUpdateViewSet, IncidentViewSet

router = DefaultRouter()
router.register("categories", IncidentCategoryViewSet, basename="incident-categories")
router.register("incidents", IncidentViewSet, basename="incidents")
router.register("updates", IncidentUpdateViewSet, basename="incident-updates")
router.register("assignments", IncidentAssignmentViewSet, basename="incident-assignments")

urlpatterns = [path("", include(router.urls))]
