from django.conf import settings
from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenRefreshView

from apps.common.permissions import IsSystemAdmin
from apps.common.responses import ok
from apps.users.models import AccountSession, EmailVerificationToken, PasswordResetToken, Role, User
from apps.users.serializers import (
    AccountSessionSerializer,
    EmailVerifySerializer,
    LoginSerializer,
    MeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    RoleSerializer,
    UserSerializer,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        data = UserSerializer(user, context={"request": request}).data
        token = EmailVerificationToken.objects.filter(user=user, used_at__isnull=True).latest("created_at")
        if settings.DEBUG:
            data["debug_email_verification_token"] = str(token.token)
        return ok(data, "Registration successful.", status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        payload = {
            "access": serializer.validated_data["access"],
            "refresh": serializer.validated_data["refresh"],
            "user": UserSerializer(serializer.validated_data["user"], context={"request": request}).data,
        }
        return ok(payload, "Login successful.")


class CustomTokenRefreshView(TokenRefreshView):
    """Wraps SimpleJWT's rotate-and-blacklist refresh with AccountSession bookkeeping,
    so a renewed refresh token keeps pointing at the same tracked session instead of
    orphaning it (which would break session listing/revocation in the UI)."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request, *args, **kwargs):
        old_refresh = request.data.get("refresh")
        # Read the incoming token's jti with verify=False, before super().post() runs:
        # rotation blacklists the old token immediately, and a verified re-parse of an
        # already-blacklisted token raises TokenError.
        old_jti = None
        if old_refresh:
            try:
                old_jti = RefreshToken(old_refresh, verify=False)["jti"]
            except TokenError:
                old_jti = None

        response = super().post(request, *args, **kwargs)

        if response.status_code == 200 and old_jti:
            new_refresh = response.data.get("refresh")
            new_jti = None
            if new_refresh:
                try:
                    new_jti = RefreshToken(new_refresh, verify=False)["jti"]
                except TokenError:
                    new_jti = None
            if new_jti:
                AccountSession.objects.filter(refresh_jti=old_jti).update(
                    refresh_jti=new_jti,
                    expires_at=timezone.now() + settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
                )
        response.data = {"success": True, "message": "Token refreshed.", "data": response.data}
        return response


class LogoutView(APIView):
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if refresh_token:
            token = RefreshToken(refresh_token)
            token.blacklist()
            AccountSession.objects.filter(refresh_jti=token["jti"], user=request.user).update(revoked_at=timezone.now())
        return ok(message="Logged out.")


class MeView(APIView):
    def get(self, request):
        return ok(MeSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        serializer = MeSerializer(request.user, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return ok(serializer.data, "Profile updated.")


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        data = {}
        if settings.DEBUG and user:
            token = PasswordResetToken.objects.filter(user=user, used_at__isnull=True).latest("created_at")
            data["debug_password_reset_token"] = str(token.token)
        return ok(data, "If the account exists, password reset instructions were sent.")


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return ok(message="Password reset successful.")


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return ok(UserSerializer(user, context={"request": request}).data, "Email verified.")


class RoleViewSet(viewsets.ModelViewSet):
    queryset = Role.objects.all()
    serializer_class = RoleSerializer
    permission_classes = [IsSystemAdmin]
    search_fields = ["name", "code"]
    ordering_fields = ["name", "created_at"]


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.select_related("role").all()
    serializer_class = UserSerializer
    permission_classes = [IsSystemAdmin]
    filterset_fields = ["role__code", "is_active", "is_email_verified", "organization", "department"]
    search_fields = ["email", "username", "first_name", "last_name", "organization", "department"]
    ordering_fields = ["date_joined", "last_login", "security_score"]

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        user = self.get_object()
        user.activate()
        return ok(UserSerializer(user, context={"request": request}).data, "Account activated.")

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.deactivate()
        return ok(UserSerializer(user, context={"request": request}).data, "Account deactivated.")

    @action(detail=True, methods=["post"])
    def reset_failed_logins(self, request, pk=None):
        user = self.get_object()
        user.failed_login_attempts = 0
        user.save(update_fields=["failed_login_attempts"])
        return ok(message="Failed login counter reset.")


class SessionViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AccountSessionSerializer

    def get_queryset(self):
        return AccountSession.objects.filter(user=self.request.user)

    @action(detail=True, methods=["post"])
    def revoke(self, request, pk=None):
        session = self.get_object()
        session.revoked_at = timezone.now()
        session.save(update_fields=["revoked_at"])
        return ok(message="Session revoked.")
