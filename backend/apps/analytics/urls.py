from django.urls import path

from apps.analytics.views import ChartAnalyticsView, OrganizationAnalyticsView, UserDashboardAnalyticsView

urlpatterns = [
    path("me/", UserDashboardAnalyticsView.as_view(), name="analytics-me"),
    path("organization/", OrganizationAnalyticsView.as_view(), name="analytics-organization"),
    path("charts/", ChartAnalyticsView.as_view(), name="analytics-charts"),
]
