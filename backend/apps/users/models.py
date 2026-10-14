import uuid

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

from apps.common.models import TimeStampedModel


class Role(TimeStampedModel):
    NORMAL_USER = "normal_user"
    SYSTEM_ADMIN = "system_admin"

    ROLE_CHOICES = (
        (NORMAL_USER, "Normal User"),
        (SYSTEM_ADMIN, "System Administrator"),
    )

    code = models.CharField(max_length=40, choices=ROLE_CHOICES, unique=True)
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    permissions = models.JSONField(default=list, blank=True)
    is_system = models.BooleanField(default=True)

    class Meta:
        db_table = "roles"
        ordering = ["name"]
        indexes = [models.Index(fields=["code"])]

    def __str__(self):
        return self.name


class User(AbstractUser):
    email = models.EmailField(unique=True, db_index=True)
    role = models.ForeignKey(Role, on_delete=models.PROTECT, related_name="users", null=True, blank=True)
    organization = models.CharField(max_length=180, blank=True)
    department = models.CharField(max_length=120, blank=True)
    phone = models.CharField(max_length=40, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    is_email_verified = models.BooleanField(default=False)
    is_deactivated = models.BooleanField(default=False)
    failed_login_attempts = models.PositiveIntegerField(default=0)
    last_failed_login = models.DateTimeField(blank=True, null=True)
    last_login_ip = models.GenericIPAddressField(blank=True, null=True)
    password_changed_at = models.DateTimeField(blank=True, null=True)
    activated_at = models.DateTimeField(blank=True, null=True)
    security_score = models.PositiveIntegerField(default=72)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["email"]),
            models.Index(fields=["is_active", "is_deactivated"]),
        ]

    @property
    def role_code(self):
        if self.is_superuser:
            return Role.SYSTEM_ADMIN
        return self.role.code if self.role else None

    def deactivate(self):
        self.is_active = False
        self.is_deactivated = True
        self.save(update_fields=["is_active", "is_deactivated"])

    def activate(self):
        self.is_active = True
        self.is_deactivated = False
        self.activated_at = timezone.now()
        self.save(update_fields=["is_active", "is_deactivated", "activated_at"])


class EmailVerificationToken(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="email_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "email_verification_tokens"
        indexes = [models.Index(fields=["token", "expires_at"])]

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > timezone.now()


class PasswordResetToken(TimeStampedModel):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="password_reset_tokens")
    token = models.UUIDField(default=uuid.uuid4, unique=True, editable=False)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(blank=True, null=True)
    request_ip = models.GenericIPAddressField(blank=True, null=True)

    class Meta:
        db_table = "password_reset_tokens"
        indexes = [models.Index(fields=["token", "expires_at"])]

    @property
    def is_valid(self):
        return self.used_at is None and self.expires_at > timezone.now()


class LoginAttempt(models.Model):
    email = models.EmailField(db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, related_name="login_attempts", blank=True, null=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    successful = models.BooleanField(default=False, db_index=True)
    failure_reason = models.CharField(max_length=180, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = "login_attempts"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["email", "successful", "created_at"])]

    def __str__(self):
        status = "success" if self.successful else "failed"
        return f"{self.email} {status} at {self.created_at:%Y-%m-%d %H:%M}"


class AccountSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="account_sessions")
    refresh_jti = models.CharField(max_length=255, unique=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    expires_at = models.DateTimeField()
    revoked_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "account_sessions"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "revoked_at"]),
            models.Index(fields=["refresh_jti"]),
        ]

    @property
    def is_active(self):
        return self.revoked_at is None and self.expires_at > timezone.now()
