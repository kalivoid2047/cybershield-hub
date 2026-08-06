from django.contrib import admin

from apps.incidents.models import Incident, IncidentAssignment, IncidentAttachment, IncidentCategory, IncidentUpdate


class AttachmentInline(admin.TabularInline):
    model = IncidentAttachment
    extra = 0


class UpdateInline(admin.TabularInline):
    model = IncidentUpdate
    extra = 0


@admin.register(IncidentCategory)
class IncidentCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug", "default_severity")
    prepopulated_fields = {"slug": ("name",)}
    search_fields = ("name", "description")


@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ("reference_number", "title", "severity", "status", "reporter", "assigned_to", "priority_score", "created_at")
    list_filter = ("severity", "status", "category", "is_draft")
    search_fields = ("reference_number", "title", "description", "affected_system")
    inlines = [AttachmentInline, UpdateInline]


admin.site.register(IncidentAttachment)
admin.site.register(IncidentUpdate)
admin.site.register(IncidentAssignment)
