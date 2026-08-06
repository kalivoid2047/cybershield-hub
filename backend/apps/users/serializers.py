from datetime import timedelta

from django.conf import settings
from django.contrib.auth import authenticate, password_validation
from django.db import transaction
from django.utils import timezone
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import (
    AccountSession,
    EmailVerificationToken,
    LoginAttempt,
    PasswordResetToken,
    Role,
    User,
)


def client_ip(request):
    forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR") if request else None
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR") if request else None


def user_agent(request):
    return request.META.get("HTTP_USER_AGENT", "") if request else ""


class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role
        fields = ["id", "code", "name", "description", "permissions", "is_system", "created_at", "updated_at"]
        read_only_fields = ["is_system", "created_at", "updated_at"]


class UserSerializer(serializers.ModelSerializer):
    role = RoleSerializer(read_only=True)
    role_id = serializers.PrimaryKeyRelatedField(queryset=Role.objects.all(), source="role", write_only=True, required=False)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "role",
            "role_id",
            "organization",
            "department",
            "phone",
            "avatar",
            "is_active",
            "is_email_verified",
            "is_deactivated",
            "security_score",
            "last_login",
            "last_login_ip",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "is_email_verified",
            "is_deactivated",
            "security_score",
            "last_login",
            "last_login_ip",
            "date_joined",
        ]


class MeSerializer(UserSerializer):
    """Self-service profile serializer. Identical to UserSerializer but without
    role_id, so an authenticated user can never grant themselves a new role
    through PATCH /auth/me/. Role changes must go through the admin-only
    UserViewSet instead."""

    class Meta(UserSerializer.Meta):
        fields = [field for field in UserSerializer.Meta.fields if field != "role_id"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=10, style={"input_type": "password"})
    password_confirm = serializers.CharField(write_only=True, style={"input_type": "password"})

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "organization",
            "department",
            "password",
            "password_confirm",
        ]
        read_only_fields = ["id"]

    def validate_email(self, value):
        value = value.lower().strip()
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("An account with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs.pop("password_confirm"):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        password_validation.validate_password(attrs["password"])
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        password = validated_data.pop("password")
        role, _ = Role.objects.get_or_create(
            code=Role.NORMAL_USER,
            defaults={"name": "Normal User", "description": "Standard learner and incident reporter."},
        )
        user = User.objects.create(role=role, is_active=True, **validated_data)
        user.set_password(password)
        user.password_changed_at = timezone.now()
        user.save(update_fields=["password", "password_changed_at"])
        EmailVerificationToken.objects.create(user=user, expires_at=timezone.now() + timedelta(days=2))
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, style={"input_type": "password"})

    default_error_messages = {
        "invalid_credentials": "Invalid email or password.",
        "inactive": "This account is inactive.",
        "deactivated": "This account has been deactivated.",
    }

    def validate(self, attrs):
        request = self.context.get("request")
        email = attrs["email"].lower().strip()
        password = attrs["password"]
        ip_address = client_ip(request)
        agent = user_agent(request)
        user = User.objects.filter(email=email).select_related("role").first()

        authenticated = authenticate(request=request, username=email, password=password)
        if authenticated is None:
            if user:
                user.failed_login_attempts += 1
                user.last_failed_login = timezone.now()
                user.save(update_fields=["failed_login_attempts", "last_failed_login"])
            LoginAttempt.objects.create(
                email=email,
                user=user,
                ip_address=ip_address,
                user_agent=agent,
                successful=False,
                failure_reason="invalid_credentials",
            )
            self.fail("invalid_credentials")

        if not authenticated.is_active:
            self.fail("inactive")
        if authenticated.is_deactivated:
            self.fail("deactivated")

        refresh = RefreshToken.for_user(authenticated)
        authenticated.failed_login_attempts = 0
        authenticated.last_login_ip = ip_address
        authenticated.save(update_fields=["failed_login_attempts", "last_login_ip"])

        LoginAttempt.objects.create(
            email=email,
            user=authenticated,
            ip_address=ip_address,
            user_agent=agent,
            successful=True,
        )
        AccountSession.objects.create(
            user=authenticated,
            refresh_jti=refresh["jti"],
            ip_address=ip_address,
            user_agent=agent,
            expires_at=timezone.now() + settings.SIMPLE_JWT["REFRESH_TOKEN_LIFETIME"],
        )
        return {
            "user": authenticated,
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }


class AuthTokenResponseSerializer(serializers.Serializer):
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def save(self, **kwargs):
        request = self.context.get("request")
        user = User.objects.filter(email=self.validated_data["email"].lower().strip()).first()
        if user:
            PasswordResetToken.objects.create(
                user=user,
                expires_at=timezone.now() + timedelta(hours=2),
                request_ip=client_ip(request),
            )
        return user


class PasswordResetConfirmSerializer(serializers.Serializer):
    token = serializers.UUIDField()
    password = serializers.CharField(write_only=True, min_length=10)
    password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        token = PasswordResetToken.objects.select_related("user").filter(token=attrs["token"]).first()
        if not token or not token.is_valid:
            raise serializers.ValidationError({"token": "The reset token is invalid or expired."})
        password_validation.validate_password(attrs["password"], user=token.user)
        attrs["token_obj"] = token
        return attrs

    def save(self, **kwargs):
        token = self.validated_data["token_obj"]
        user = token.user
        user.set_password(self.validated_data["password"])
        user.password_changed_at = timezone.now()
        user.failed_login_attempts = 0
        user.save(update_fields=["password", "password_changed_at", "failed_login_attempts"])
        token.used_at = timezone.now()
        token.save(update_fields=["used_at"])
        return user


class EmailVerifySerializer(serializers.Serializer):
    token = serializers.UUIDField()

    def validate_token(self, value):
        token = EmailVerificationToken.objects.select_related("user").filter(token=value).first()
        if not token or not token.is_valid:
            raise serializers.ValidationError("The verification token is invalid or expired.")
        self.token_obj = token
        return value

    def save(self, **kwargs):
        token = self.token_obj
        user = token.user
        user.is_email_verified = True
        user.save(update_fields=["is_email_verified"])
        token.used_at = timezone.now()
        token.save(update_fields=["used_at"])
        return user


class AccountSessionSerializer(serializers.ModelSerializer):
    active = serializers.BooleanField(source="is_active", read_only=True)

    class Meta:
        model = AccountSession
        fields = ["id", "ip_address", "user_agent", "created_at", "last_seen_at", "expires_at", "revoked_at", "active"]
        read_only_fields = fields
