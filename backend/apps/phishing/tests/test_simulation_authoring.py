import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


def _payload(**overrides):
    payload = {
        "title": "Fake parcel notice",
        "scenario": "A courier text asks to pay a redelivery fee.",
        "difficulty": "medium",
        "sender_name": "Parcel Service",
        "sender_email": "no-reply@parce1-track.example",
        "subject": "Pay redelivery fee",
        "body": "Your parcel is on hold. Pay 1.99 to release it.",
        "urls": ["https://parce1-track.example/pay"],
        "red_flags": ["lookalike domain", "payment request"],
        "is_phishing": True,
        "training_tip": "Never pay fees through links in unexpected messages.",
        "is_active": True,
    }
    payload.update(overrides)
    return payload


class TestAuthoringSimulations:
    def test_admin_creates_a_simulation(self, admin_client):
        response = admin_client.post(reverse("phishing-simulations-list"), _payload(), format="json")

        assert response.status_code == 201
        assert response.json()["red_flags"] == ["lookalike domain", "payment request"]

    def test_normal_user_cannot_create(self, user_client):
        assert user_client.post(reverse("phishing-simulations-list"), _payload(), format="json").status_code == 403

    def test_urls_must_be_http_links(self, admin_client):
        response = admin_client.post(reverse("phishing-simulations-list"), _payload(urls=["javascript:alert(1)"]), format="json")

        assert response.status_code == 400

    def test_lists_are_cleaned_of_blank_entries(self, admin_client):
        response = admin_client.post(reverse("phishing-simulations-list"), _payload(red_flags=["  urgent  ", "", "   "], urls=[]), format="json")

        assert response.status_code == 201
        assert response.json()["red_flags"] == ["urgent"]

    def test_inactive_simulations_are_hidden_from_learners(self, admin_client, user_client):
        created = admin_client.post(reverse("phishing-simulations-list"), _payload(is_active=False), format="json").json()

        listing = user_client.get(reverse("phishing-simulations-list")).json()
        ids = [item["id"] for item in (listing.get("results") or listing.get("data") or [])]

        assert created["id"] not in ids
