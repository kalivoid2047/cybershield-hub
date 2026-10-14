import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


class TestRoleAndUserAdminAccess:
    def test_normal_user_cannot_list_users(self, user_client):
        response = user_client.get(reverse("users-list"))
        assert response.status_code == 403

    def test_admin_can_list_users(self, admin_client, normal_user, admin_user):
        response = admin_client.get(reverse("users-list"))
        assert response.status_code == 200

    def test_anonymous_cannot_list_users(self, api_client):
        response = api_client.get(reverse("users-list"))
        assert response.status_code == 401

    def test_admin_can_deactivate_and_activate_a_user(self, admin_client, normal_user):
        deactivate_response = admin_client.post(reverse("users-deactivate", args=[normal_user.id]))
        normal_user.refresh_from_db()
        assert deactivate_response.status_code == 200
        assert normal_user.is_active is False
        assert normal_user.is_deactivated is True

        activate_response = admin_client.post(reverse("users-activate", args=[normal_user.id]))
        normal_user.refresh_from_db()
        assert activate_response.status_code == 200
        assert normal_user.is_active is True
        assert normal_user.is_deactivated is False

    def test_admin_can_change_a_users_role_via_the_admin_endpoint(self, admin_client, normal_user, roles):
        response = admin_client.patch(reverse("users-detail", args=[normal_user.id]), {"role_id": roles["system_admin"].id}, format="json")

        assert response.status_code == 200
        normal_user.refresh_from_db()
        assert normal_user.role.code == "system_admin"

    def test_admin_can_reset_failed_login_counter(self, admin_client, normal_user):
        normal_user.failed_login_attempts = 5
        normal_user.save(update_fields=["failed_login_attempts"])

        response = admin_client.post(reverse("users-reset-failed-logins", args=[normal_user.id]))

        assert response.status_code == 200
        normal_user.refresh_from_db()
        assert normal_user.failed_login_attempts == 0


class TestSessions:
    def test_user_only_sees_own_sessions(self, api_client, normal_user, other_normal_user):
        api_client.post(reverse("login"), {"email": normal_user.email, "password": "Str0ngPassw0rd!"}, format="json")
        api_client.force_authenticate(user=other_normal_user)

        response = api_client.get(reverse("sessions-list"))

        assert response.status_code == 200
        assert response.json()["count"] == 0
