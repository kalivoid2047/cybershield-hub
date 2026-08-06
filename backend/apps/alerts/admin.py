from django.contrib import admin

from apps.alerts.models import Notification, SecurityAlert


@admin.register(SecurityAlert)
class SecurityAlertAdmin(admin.ModelAdmin):
    list_display = ("title", "priority", "alert_type", "audience_role", "is_active", "starts_at", "expires_at")
    list_filter = ("priority", "alert_type", "is_active")
    search_fields = ("title", "body")


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ("user", "alert", "is_read", "created_at")
    list_filter = ("is_read", "created_at")
    search_fields = ("user__email", "alert__title")
