from django.contrib import admin

from apps.audit.models import AuditLog


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ("created_at", "actor", "action", "resource_type", "resource_id", "ip_address")
    list_filter = ("action", "resource_type", "created_at")
    search_fields = ("actor__email", "action", "resource_type", "resource_id", "ip_address")
    readonly_fields = ("actor", "action", "resource_type", "resource_id", "ip_address", "user_agent", "metadata", "created_at")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False
