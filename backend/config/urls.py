from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def health_check(request):
    return JsonResponse({"status": "ok", "service": "cybershield-hub"})


api_v1 = [
    path("auth/", include("apps.users.urls")),
    path("training/", include("apps.training.urls")),
    path("quizzes/", include("apps.quizzes.urls")),
    path("phishing/", include("apps.phishing.urls")),
    path("incidents/", include("apps.incidents.urls")),
    path("alerts/", include("apps.alerts.urls")),
    path("analytics/", include("apps.analytics.urls")),
    path("audit/", include("apps.audit.urls")),
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", health_check, name="health-check"),
    path("api/v1/", include(api_v1)),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
