import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db

CURRENT = "Str0ngPassw0rd!"
NEW = "An0ther-Str0ng-Pass!"


def _post(client, **overrides):
    payload = {"current_password": CURRENT, "password": NEW, "password_confirm": NEW}
    payload.update(overrides)
    return client.post(reverse("change-password"), payload, format="json")


class TestChangePassword:
    def test_changes_password_and_old_one_stops_working(self, user_client, normal_user):
        response = _post(user_client)

        assert response.status_code == 200
        normal_user.refresh_from_db()
        assert normal_user.check_password(NEW)
        assert not normal_user.check_password(CURRENT)
        assert normal_user.password_changed_at is not None

    def test_wrong_current_password_is_rejected(self, user_client, normal_user):
        response = _post(user_client, current_password="not-my-password")

        assert response.status_code == 400
        normal_user.refresh_from_db()
        assert normal_user.check_password(CURRENT)

    def test_confirmation_must_match(self, user_client):
        assert _post(user_client, password_confirm="different-Passw0rd!").status_code == 400

    def test_new_password_must_differ_from_current(self, user_client):
        assert _post(user_client, password=CURRENT, password_confirm=CURRENT).status_code == 400

    def test_weak_password_is_rejected(self, user_client):
        assert _post(user_client, password="password12345", password_confirm="password12345").status_code == 400

    def test_requires_authentication(self, api_client):
        assert _post(api_client).status_code in {401, 403}
