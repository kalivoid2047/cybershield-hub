import pytest
from django.urls import reverse

from apps.incidents.models import Incident, IncidentUpdate

pytestmark = pytest.mark.django_db


def incident_payload(category, **overrides):
    payload = {
        "title": "Suspicious login from unknown device",
        "category_id": category.id,
        "severity": "high",
        "description": "A login occurred from an unrecognized device and location.",
        "affected_system": "SSO Portal",
        "occurred_at": "2026-08-01T10:00:00Z",
        "is_draft": False,
    }
    payload.update(overrides)
    return payload


class TestIncidentCreation:
    def test_user_can_report_an_incident(self, user_client, incident_category, normal_user):
        response = user_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")

        assert response.status_code == 201
        incident = Incident.objects.get()
        assert incident.reporter == normal_user
        assert incident.reference_number.startswith("INC-")
        assert incident.submitted_at is not None

    def test_draft_incident_has_no_submitted_at(self, user_client, incident_category):
        response = user_client.post(
            reverse("incidents-list"), incident_payload(incident_category, is_draft=True), format="json"
        )

        assert response.status_code == 201
        incident = Incident.objects.get()
        assert incident.is_draft is True
        assert incident.submitted_at is None

    def test_priority_score_reflects_severity(self, user_client, incident_category):
        response = user_client.post(
            reverse("incidents-list"), incident_payload(incident_category, severity="critical"), format="json"
        )

        incident = Incident.objects.get(id=response.json()["id"])
        assert incident.priority_score >= 95

    def test_creating_incident_records_an_initial_update(self, user_client, incident_category):
        response = user_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")

        incident = Incident.objects.get(id=response.json()["id"])
        assert IncidentUpdate.objects.filter(incident=incident).exists()

    def test_anonymous_cannot_report_incident(self, api_client, incident_category):
        response = api_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")
        assert response.status_code == 401


class TestIncidentVisibility:
    def test_reporter_only_sees_own_incidents(self, user_client, other_normal_user, api_client, incident_category):
        user_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")
        api_client.force_authenticate(user=other_normal_user)

        response = api_client.get(reverse("incidents-list"))

        assert response.json()["count"] == 0

    def test_admin_sees_all_incidents(self, user_client, admin_client, incident_category):
        user_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")

        response = admin_client.get(reverse("incidents-list"))

        assert response.json()["count"] == 1


class TestIncidentAssignmentAndTransitions:
    def test_admin_can_assign_incident_to_an_admin(self, user_client, admin_client, incident_category, admin_user):
        create_response = user_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")
        incident_id = create_response.json()["id"]

        response = admin_client.post(
            reverse("incidents-assign", args=[incident_id]), {"officer_id": admin_user.id, "note": "Please investigate"}, format="json"
        )

        assert response.status_code == 200
        incident = Incident.objects.get(id=incident_id)
        assert incident.assigned_to == admin_user
        assert incident.status == Incident.INVESTIGATING

    def test_normal_user_cannot_assign_incident(self, user_client, incident_category, admin_user):
        create_response = user_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")
        incident_id = create_response.json()["id"]

        response = user_client.post(
            reverse("incidents-assign", args=[incident_id]), {"officer_id": admin_user.id}, format="json"
        )

        assert response.status_code == 403

    def test_assign_to_non_admin_is_rejected(self, user_client, admin_client, incident_category, other_normal_user):
        create_response = user_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")
        incident_id = create_response.json()["id"]

        response = admin_client.post(
            reverse("incidents-assign", args=[incident_id]), {"officer_id": other_normal_user.id}, format="json"
        )

        assert response.status_code == 400

    def test_admin_can_transition_incident_status(self, user_client, admin_client, incident_category):
        create_response = user_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")
        incident_id = create_response.json()["id"]

        response = admin_client.post(
            reverse("incidents-transition", args=[incident_id]),
            {"status": "resolved", "note": "Confirmed false alarm.", "is_internal": False},
            format="json",
        )

        assert response.status_code == 200
        incident = Incident.objects.get(id=incident_id)
        assert incident.status == Incident.RESOLVED
        assert incident.resolved_at is not None

    def test_normal_user_cannot_transition_incident(self, user_client, incident_category):
        create_response = user_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")
        incident_id = create_response.json()["id"]

        response = user_client.post(
            reverse("incidents-transition", args=[incident_id]),
            {"status": "resolved", "note": "n/a"},
            format="json",
        )

        assert response.status_code == 403


class TestIncidentQueueAndHeatmap:
    def test_queue_is_admin_only_and_groups_by_status(self, user_client, admin_client, incident_category):
        user_client.post(reverse("incidents-list"), incident_payload(incident_category), format="json")

        forbidden = user_client.get(reverse("incidents-queue"))
        assert forbidden.status_code == 403

        response = admin_client.get(reverse("incidents-queue"))
        assert response.status_code == 200
        assert "open" in response.json()["data"]
        assert len(response.json()["data"]["open"]) == 1

    def test_heatmap_returns_severity_status_counts(self, user_client, admin_client, incident_category):
        user_client.post(reverse("incidents-list"), incident_payload(incident_category, severity="critical"), format="json")

        response = admin_client.get(reverse("incidents-heatmap"))

        assert response.status_code == 200
        rows = response.json()["data"]
        assert any(row["severity"] == "critical" and row["count"] == 1 for row in rows)
