from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.users.views import (
    CustomTokenRefreshView,
    LoginView,
    LogoutView,
    MeView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    RegisterView,
    RoleViewSet,
    SessionViewSet,
    UserViewSet,
    VerifyEmailView,
)

router = DefaultRouter()
router.register("roles", RoleViewSet, basename="roles")
router.register("users", UserViewSet, basename="users")
router.register("sessions", SessionViewSet, basename="sessions")

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("token/refresh/", CustomTokenRefreshView.as_view(), name="token-refresh"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("me/", MeView.as_view(), name="me"),
    path("password-reset/", PasswordResetRequestView.as_view(), name="password-reset"),
    path("password-reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("", include(router.urls)),
]
