import pytest
from django.core.files.uploadedfile import SimpleUploadedFile
from django.urls import reverse

from apps.common.validators import MAX_UPLOAD_SIZE
from apps.incidents.models import Incident, IncidentAttachment

pytestmark = pytest.mark.django_db


def multipart_payload(category, upload):
    return {
        "title": "Suspicious e-mail with a strange link",
        "category_id": category.id,
        "severity": "high",
        "description": "The sender address looks wrong and the link opens an unknown site.",
        "affected_system": "E-mail",
        "occurred_at": "2026-08-01T10:00:00Z",
        "is_draft": "false",
        "attachments": [upload],
    }


class TestEvidenceUpload:
    def test_allowed_file_type_is_stored(self, user_client, incident_category):
        upload = SimpleUploadedFile("proof.pdf", b"%PDF-1.4 test", content_type="application/pdf")

        response = user_client.post(reverse("incidents-list"), multipart_payload(incident_category, upload), format="multipart")

        assert response.status_code == 201
        assert IncidentAttachment.objects.count() == 1

    def test_disallowed_file_type_is_rejected(self, user_client, incident_category):
        upload = SimpleUploadedFile("virus.exe", b"MZ", content_type="application/octet-stream")

        response = user_client.post(reverse("incidents-list"), multipart_payload(incident_category, upload), format="multipart")

        assert response.status_code == 400
        assert Incident.objects.count() == 0
        assert IncidentAttachment.objects.count() == 0

    def test_file_over_the_size_limit_is_rejected(self, user_client, incident_category):
        upload = SimpleUploadedFile("big.pdf", b"0" * (MAX_UPLOAD_SIZE + 1), content_type="application/pdf")

        response = user_client.post(reverse("incidents-list"), multipart_payload(incident_category, upload), format="multipart")

        assert response.status_code == 400
        assert Incident.objects.count() == 0
