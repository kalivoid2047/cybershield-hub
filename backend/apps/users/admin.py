from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from apps.users.models import AccountSession, EmailVerificationToken, LoginAttempt, PasswordResetToken, Role, User


@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_system", "created_at")
    search_fields = ("name", "code")


@admin.register(User)
class CyberShieldUserAdmin(UserAdmin):
    model = User
    list_display = ("email", "username", "role", "organization", "is_active", "is_email_verified", "last_login")
    list_filter = ("role", "is_active", "is_email_verified", "organization")
    search_fields = ("email", "username", "first_name", "last_name", "organization")
    ordering = ("email",)
    fieldsets = UserAdmin.fieldsets + (
        (
            "CyberShield",
            {
                "fields": (
                    "role",
                    "organization",
                    "department",
                    "phone",
                    "avatar",
                    "is_email_verified",
                    "is_deactivated",
                    "failed_login_attempts",
                    "last_failed_login",
                    "last_login_ip",
                    "password_changed_at",
                    "activated_at",
                    "security_score",
                )
            },
        ),
    )


@admin.register(LoginAttempt)
class LoginAttemptAdmin(admin.ModelAdmin):
    list_display = ("email", "successful", "ip_address", "created_at")
    list_filter = ("successful", "created_at")
    search_fields = ("email", "ip_address")
    readonly_fields = ("email", "user", "ip_address", "user_agent", "successful", "failure_reason", "created_at")


admin.site.register(EmailVerificationToken)
admin.site.register(PasswordResetToken)
admin.site.register(AccountSession)
