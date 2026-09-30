import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


def _report(user_client, category):
    payload = {
        "title": "Odd MFA prompts",
        "category_id": category.id,
        "severity": "high",
        "description": "Several unexpected MFA prompts.",
        "affected_system": "IdP",
        "occurred_at": "2026-08-01T10:00:00Z",
        "is_draft": False,
    }
    return user_client.post(reverse("incidents-list"), payload, format="json").json()["id"]


class TestInternalNotesStayInternal:
    def test_reporter_detail_hides_internal_updates(self, user_client, officer_client, incident_category, officer_user):
        incident_id = _report(user_client, incident_category)
        officer_client.post(reverse("incidents-assign", args=[incident_id]), {"officer_id": officer_user.id, "note": "secret triage"}, format="json")
        officer_client.post(
            reverse("incidents-transition", args=[incident_id]),
            {"status": "escalated", "note": "visible note", "is_internal": False},
            format="json",
        )

        updates = user_client.get(reverse("incidents-detail", args=[incident_id])).json()["updates"]

        assert updates, "the reporter should still see the public timeline"
        assert all(not update["is_internal"] for update in updates)
        assert "secret triage" not in str(updates)
        assert any(update["note"] == "visible note" for update in updates)

    def test_officer_detail_includes_internal_updates(self, user_client, officer_client, incident_category, officer_user):
        incident_id = _report(user_client, incident_category)
        officer_client.post(reverse("incidents-assign", args=[incident_id]), {"officer_id": officer_user.id, "note": "secret triage"}, format="json")

        updates = officer_client.get(reverse("incidents-detail", args=[incident_id])).json()["updates"]

        assert any(update["is_internal"] for update in updates)
