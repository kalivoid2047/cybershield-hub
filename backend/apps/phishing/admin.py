from django.contrib import admin

from apps.phishing.models import PhishingAttempt, PhishingSimulation


@admin.register(PhishingSimulation)
class PhishingSimulationAdmin(admin.ModelAdmin):
    list_display = ("title", "difficulty", "sender_email", "is_phishing", "is_active", "created_at")
    list_filter = ("difficulty", "is_phishing", "is_active")
    search_fields = ("title", "sender_email", "subject", "body")


@admin.register(PhishingAttempt)
class PhishingAttemptAdmin(admin.ModelAdmin):
    list_display = ("user", "simulation", "classification", "correct", "score", "created_at")
    list_filter = ("classification", "correct", "created_at")
    search_fields = ("user__email", "simulation__title")
