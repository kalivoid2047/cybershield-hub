from rest_framework import serializers

from apps.phishing.models import PhishingAttempt, PhishingSimulation


class PhishingSimulationSerializer(serializers.ModelSerializer):
    attempt_count = serializers.IntegerField(read_only=True)
    latest_score = serializers.IntegerField(read_only=True)

    class Meta:
        model = PhishingSimulation
        fields = [
            "id",
            "title",
            "scenario",
            "difficulty",
            "sender_name",
            "sender_email",
            "subject",
            "body",
            "urls",
            "red_flags",
            "is_phishing",
            "training_tip",
            "is_active",
            "attempt_count",
            "latest_score",
            "created_at",
            "updated_at",
        ]


class PhishingAttemptSerializer(serializers.ModelSerializer):
    simulation_title = serializers.CharField(source="simulation.title", read_only=True)

    class Meta:
        model = PhishingAttempt
        fields = [
            "id",
            "simulation",
            "simulation_title",
            "classification",
            "inspected_urls",
            "selected_flags",
            "correct",
            "score",
            "feedback",
            "created_at",
        ]
        read_only_fields = ["correct", "score", "feedback", "created_at"]


class SubmitPhishingAttemptSerializer(serializers.Serializer):
    classification = serializers.ChoiceField(choices=PhishingAttempt.CLASSIFICATION_CHOICES)
    inspected_urls = serializers.ListField(child=serializers.URLField(), required=False)
    selected_flags = serializers.ListField(child=serializers.CharField(max_length=220), required=False)
