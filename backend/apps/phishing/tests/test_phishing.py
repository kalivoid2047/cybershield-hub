import pytest
from django.urls import reverse

from apps.phishing.models import PhishingAttempt
from apps.phishing.services import grade_phishing_attempt

pytestmark = pytest.mark.django_db


class TestPhishingSubmission:
    def test_correct_classification_and_all_flags_scores_100(self, user_client, phishing_simulation):
        url = reverse("phishing-simulations-submit", args=[phishing_simulation.id])

        response = user_client.post(
            url,
            {"classification": "suspicious", "selected_flags": phishing_simulation.red_flags, "inspected_urls": []},
            format="json",
        )

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["correct"] is True
        assert data["score"] == 100

    def test_wrong_classification_scores_lower(self, user_client, phishing_simulation):
        url = reverse("phishing-simulations-submit", args=[phishing_simulation.id])

        response = user_client.post(url, {"classification": "safe", "selected_flags": []}, format="json")

        assert response.status_code == 200
        data = response.json()["data"]
        assert data["correct"] is False
        assert data["score"] == 0

    def test_partial_flag_selection_gives_partial_credit(self, user_client, phishing_simulation):
        url = reverse("phishing-simulations-submit", args=[phishing_simulation.id])

        response = user_client.post(
            url,
            {"classification": "suspicious", "selected_flags": [phishing_simulation.red_flags[0]]},
            format="json",
        )

        data = response.json()["data"]
        assert 70 <= data["score"] < 100

    def test_attempt_is_persisted_for_the_user(self, user_client, phishing_simulation, normal_user):
        url = reverse("phishing-simulations-submit", args=[phishing_simulation.id])

        user_client.post(url, {"classification": "suspicious", "selected_flags": []}, format="json")

        assert PhishingAttempt.objects.filter(user=normal_user, simulation=phishing_simulation).exists()

    def test_inactive_simulation_hidden_from_normal_users(self, user_client, phishing_simulation):
        phishing_simulation.is_active = False
        phishing_simulation.save(update_fields=["is_active"])

        response = user_client.get(reverse("phishing-simulations-list"))

        ids = {item["id"] for item in response.json()["results"]}
        assert phishing_simulation.id not in ids


class TestPhishingGradingService:
    def test_safe_simulation_correct_classification_gets_full_credit_without_flags(self, phishing_simulation, normal_user):
        phishing_simulation.is_phishing = False
        phishing_simulation.red_flags = []
        phishing_simulation.save(update_fields=["is_phishing", "red_flags"])
        attempt = PhishingAttempt.objects.create(user=normal_user, simulation=phishing_simulation, classification="safe")

        graded = grade_phishing_attempt(attempt)

        assert graded.correct is True
        assert graded.score == 100

    def test_feedback_includes_expected_classification_and_tip(self, phishing_simulation, normal_user):
        phishing_simulation.training_tip = "Always verify the sender's domain."
        phishing_simulation.save(update_fields=["training_tip"])
        attempt = PhishingAttempt.objects.create(user=normal_user, simulation=phishing_simulation, classification="suspicious")

        graded = grade_phishing_attempt(attempt)

        assert graded.feedback["expected"] == "suspicious"
        assert graded.feedback["training_tip"] == "Always verify the sender's domain."


class TestPhishingAttemptVisibility:
    def test_normal_user_only_sees_own_attempts(self, user_client, other_normal_user, api_client, phishing_simulation):
        user_client.post(
            reverse("phishing-simulations-submit", args=[phishing_simulation.id]),
            {"classification": "suspicious", "selected_flags": []},
            format="json",
        )
        api_client.force_authenticate(user=other_normal_user)

        response = api_client.get(reverse("phishing-attempts-list"))

        assert response.json()["count"] == 0

    def test_officer_sees_all_attempts(self, user_client, officer_client, phishing_simulation):
        user_client.post(
            reverse("phishing-simulations-submit", args=[phishing_simulation.id]),
            {"classification": "suspicious", "selected_flags": []},
            format="json",
        )

        response = officer_client.get(reverse("phishing-attempts-list"))

        assert response.json()["count"] == 1
