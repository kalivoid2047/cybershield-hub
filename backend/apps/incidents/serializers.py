from django.core.exceptions import ValidationError as DjangoValidationError
from django.utils import timezone
from rest_framework import serializers

from apps.common.validators import validate_evidence_upload
from apps.incidents.models import Incident, IncidentAssignment, IncidentAttachment, IncidentCategory, IncidentUpdate
from apps.users.models import Role
from apps.users.serializers import UserSerializer


class IncidentCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = IncidentCategory
        fields = ["id", "name", "slug", "description", "default_severity", "created_at", "updated_at"]


class IncidentAttachmentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = IncidentAttachment
        fields = ["id", "file", "file_url", "original_name", "content_type", "size", "uploaded_by", "created_at"]
        read_only_fields = ["original_name", "content_type", "size", "uploaded_by", "created_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return obj.file.url if obj.file else None


class IncidentUpdateSerializer(serializers.ModelSerializer):
    actor = UserSerializer(read_only=True)

    class Meta:
        model = IncidentUpdate
        fields = ["id", "actor", "status_from", "status_to", "note", "is_internal", "created_at"]
        read_only_fields = ["actor", "status_from", "status_to", "created_at"]


class IncidentListSerializer(serializers.ModelSerializer):
    category = IncidentCategorySerializer(read_only=True)
    reporter = UserSerializer(read_only=True)
    assigned_to = UserSerializer(read_only=True)
    attachment_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "reference_number",
            "title",
            "category",
            "severity",
            "affected_system",
            "occurred_at",
            "reporter",
            "assigned_to",
            "status",
            "priority_score",
            "is_draft",
            "submitted_at",
            "attachment_count",
            "created_at",
            "updated_at",
        ]


class IncidentDetailSerializer(IncidentListSerializer):
    description = serializers.CharField()
    attachments = IncidentAttachmentSerializer(many=True, read_only=True)
    updates = serializers.SerializerMethodField()

    class Meta(IncidentListSerializer.Meta):
        fields = IncidentListSerializer.Meta.fields + ["description", "attachments", "updates", "resolved_at", "closed_at"]

    def get_updates(self, obj):
        # Internal notes (assignment chatter, triage remarks) are for the response team only.
        request = self.context.get("request")
        is_staff_role = bool(request and request.user.is_authenticated and request.user.role_code in {Role.SYSTEM_ADMIN})
        updates = [update for update in obj.updates.all() if is_staff_role or not update.is_internal]
        return IncidentUpdateSerializer(updates, many=True, context=self.context).data


class IncidentCreateUpdateSerializer(serializers.ModelSerializer):
    category_id = serializers.PrimaryKeyRelatedField(queryset=IncidentCategory.objects.all(), source="category")
    attachments = serializers.ListField(child=serializers.FileField(), required=False, write_only=True)

    class Meta:
        model = Incident
        fields = [
            "id",
            "reference_number",
            "title",
            "category_id",
            "severity",
            "description",
            "affected_system",
            "occurred_at",
            "is_draft",
            "attachments",
        ]
        read_only_fields = ["id", "reference_number"]

    def validate_attachments(self, files):
        # The model-level validators only run on full_clean(), which objects.create() skips,
        # so the type and size rules must be applied here.
        for file_obj in files:
            try:
                validate_evidence_upload(file_obj)
            except DjangoValidationError as exc:
                raise serializers.ValidationError(f"{file_obj.name}: {' '.join(exc.messages)}")
        return files

    def create(self, validated_data):
        files = validated_data.pop("attachments", [])
        incident = Incident.objects.create(reporter=self.context["request"].user, **validated_data)
        for file_obj in files:
            IncidentAttachment.objects.create(
                incident=incident,
                file=file_obj,
                original_name=file_obj.name,
                content_type=getattr(file_obj, "content_type", ""),
                size=file_obj.size,
                uploaded_by=self.context["request"].user,
            )
        IncidentUpdate.objects.create(
            incident=incident,
            actor=self.context["request"].user,
            status_to=incident.status,
            note="Incident draft saved." if incident.is_draft else "Incident submitted.",
        )
        return incident

    def update(self, instance, validated_data):
        files = validated_data.pop("attachments", [])
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if not instance.is_draft and not instance.submitted_at:
            instance.submitted_at = timezone.now()
        instance.save()
        for file_obj in files:
            IncidentAttachment.objects.create(
                incident=instance,
                file=file_obj,
                original_name=file_obj.name,
                content_type=getattr(file_obj, "content_type", ""),
                size=file_obj.size,
                uploaded_by=self.context["request"].user,
            )
        return instance


class IncidentAssignmentSerializer(serializers.ModelSerializer):
    assigned_to_detail = UserSerializer(source="assigned_to", read_only=True)

    class Meta:
        model = IncidentAssignment
        fields = ["id", "incident", "assigned_to", "assigned_to_detail", "assigned_by", "note", "created_at"]
        read_only_fields = ["assigned_by", "created_at"]


class IncidentTransitionSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Incident.STATUS_CHOICES)
    note = serializers.CharField()
    is_internal = serializers.BooleanField(default=False)


class IncidentAssignSerializer(serializers.Serializer):
    officer_id = serializers.IntegerField()
    note = serializers.CharField(required=False, allow_blank=True)
