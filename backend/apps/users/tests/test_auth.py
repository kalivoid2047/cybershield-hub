import uuid
from datetime import timedelta

import pytest
from django.urls import reverse
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import AccountSession, EmailVerificationToken, LoginAttempt, PasswordResetToken, User

pytestmark = pytest.mark.django_db


class TestRegister:
    def test_register_creates_user_with_normal_role_and_verification_token(self, api_client):
        url = reverse("register")
        payload = {
            "username": "newanalyst",
            "email": "new.analyst@cybershield.local",
            "first_name": "New",
            "last_name": "Analyst",
            "password": "Str0ngPassw0rd!",
            "password_confirm": "Str0ngPassw0rd!",
        }

        response = api_client.post(url, payload, format="json")

        assert response.status_code == 201
        body = response.json()
        assert body["success"] is True
        user = User.objects.get(email="new.analyst@cybershield.local")
        assert user.role.code == "normal_user"
        assert user.is_active is True
        assert user.check_password("Str0ngPassw0rd!")
        assert EmailVerificationToken.objects.filter(user=user).exists()

    def test_register_surfaces_debug_verification_token_when_debug_is_on(self, api_client, settings):
        # Django's test runner forces DEBUG off; flip it back on to cover the
        # convenience behaviour the view provides for local development.
        settings.DEBUG = True
        url = reverse("register")
        payload = {
            "username": "debuganalyst",
            "email": "debug.analyst@cybershield.local",
            "password": "Str0ngPassw0rd!",
            "password_confirm": "Str0ngPassw0rd!",
        }

        response = api_client.post(url, payload, format="json")

        assert response.status_code == 201
        token = response.json()["data"]["debug_email_verification_token"]
        user = User.objects.get(email="debug.analyst@cybershield.local")
        assert EmailVerificationToken.objects.get(user=user, used_at__isnull=True).token == uuid.UUID(token)

    def test_register_rejects_mismatched_passwords(self, api_client):
        url = reverse("register")
        payload = {
            "username": "mismatch",
            "email": "mismatch@cybershield.local",
            "password": "Str0ngPassw0rd!",
            "password_confirm": "SomethingElse!23",
        }

        response = api_client.post(url, payload, format="json")

        assert response.status_code == 400
        assert not User.objects.filter(email="mismatch@cybershield.local").exists()

    def test_register_rejects_duplicate_email(self, api_client, normal_user):
        url = reverse("register")
        payload = {
            "username": "duplicate",
            "email": normal_user.email,
            "password": "Str0ngPassw0rd!",
            "password_confirm": "Str0ngPassw0rd!",
        }

        response = api_client.post(url, payload, format="json")

        assert response.status_code == 400
        assert User.objects.filter(email=normal_user.email).count() == 1


class TestLogin:
    def test_login_with_valid_credentials_returns_tokens(self, api_client, normal_user):
        url = reverse("login")

        response = api_client.post(url, {"email": normal_user.email, "password": "Str0ngPassw0rd!"}, format="json")

        assert response.status_code == 200
        data = response.json()["data"]
        assert "access" in data and "refresh" in data
        assert data["user"]["email"] == normal_user.email
        assert LoginAttempt.objects.filter(email=normal_user.email, successful=True).exists()
        assert AccountSession.objects.filter(user=normal_user).exists()

    def test_login_with_wrong_password_fails_and_records_attempt(self, api_client, normal_user):
        url = reverse("login")

        response = api_client.post(url, {"email": normal_user.email, "password": "wrong-password"}, format="json")

        assert response.status_code == 400
        normal_user.refresh_from_db()
        assert normal_user.failed_login_attempts == 1
        assert LoginAttempt.objects.filter(email=normal_user.email, successful=False).exists()

    def test_login_rejects_deactivated_account(self, api_client, normal_user):
        normal_user.deactivate()
        url = reverse("login")

        response = api_client.post(url, {"email": normal_user.email, "password": "Str0ngPassw0rd!"}, format="json")

        assert response.status_code == 400


class TestTokenRefresh:
    def test_refresh_issues_a_new_access_token(self, api_client, normal_user):
        login_response = api_client.post(
            reverse("login"), {"email": normal_user.email, "password": "Str0ngPassw0rd!"}, format="json"
        )
        refresh_token = login_response.json()["data"]["refresh"]

        response = api_client.post(reverse("token-refresh"), {"refresh": refresh_token}, format="json")

        assert response.status_code == 200
        data = response.json()["data"]
        assert "access" in data
        assert data["access"] != login_response.json()["data"]["access"]

    def test_refresh_rotates_the_refresh_token_and_blacklists_the_old_one(self, api_client, normal_user):
        login_response = api_client.post(
            reverse("login"), {"email": normal_user.email, "password": "Str0ngPassw0rd!"}, format="json"
        )
        old_refresh = login_response.json()["data"]["refresh"]

        first = api_client.post(reverse("token-refresh"), {"refresh": old_refresh}, format="json")
        assert first.status_code == 200

        reused = api_client.post(reverse("token-refresh"), {"refresh": old_refresh}, format="json")
        assert reused.status_code == 401

    def test_refresh_keeps_the_account_session_pointed_at_the_rotated_token(self, api_client, normal_user):
        login_response = api_client.post(
            reverse("login"), {"email": normal_user.email, "password": "Str0ngPassw0rd!"}, format="json"
        )
        old_refresh = login_response.json()["data"]["refresh"]
        session = AccountSession.objects.get(user=normal_user)

        response = api_client.post(reverse("token-refresh"), {"refresh": old_refresh}, format="json")
        new_refresh = response.json()["data"]["refresh"]

        session.refresh_from_db()
        assert session.refresh_jti == RefreshToken(new_refresh)["jti"]

    def test_refresh_rejects_an_invalid_token(self, api_client):
        response = api_client.post(reverse("token-refresh"), {"refresh": "not-a-real-token"}, format="json")
        assert response.status_code == 401


class TestMeAndSessions:
    def test_me_requires_authentication(self, api_client):
        response = api_client.get(reverse("me"))
        assert response.status_code == 401

    def test_me_returns_current_user(self, user_client, normal_user):
        response = user_client.get(reverse("me"))
        assert response.status_code == 200
        assert response.json()["data"]["email"] == normal_user.email

    def test_me_patch_updates_profile_fields(self, user_client):
        response = user_client.patch(reverse("me"), {"department": "Finance"}, format="json")
        assert response.status_code == 200
        assert response.json()["data"]["department"] == "Finance"

    def test_me_patch_cannot_escalate_role_via_role_id(self, user_client, normal_user, roles):
        response = user_client.patch(reverse("me"), {"role_id": roles["system_admin"].id}, format="json")

        assert response.status_code == 200
        assert "role_id" not in response.json()["data"]
        normal_user.refresh_from_db()
        assert normal_user.role.code == "normal_user"  # role_id is stripped from the self-service serializer.

    def test_me_patch_still_returns_current_role_read_only(self, user_client, normal_user):
        response = user_client.patch(reverse("me"), {"department": "IT"}, format="json")

        assert response.status_code == 200
        assert response.json()["data"]["role"]["code"] == "normal_user"

    def test_logout_blacklists_refresh_token_and_revokes_session(self, api_client, normal_user):
        login_response = api_client.post(
            reverse("login"), {"email": normal_user.email, "password": "Str0ngPassw0rd!"}, format="json"
        )
        tokens = login_response.json()["data"]
        client = api_client
        client.force_authenticate(user=normal_user)

        response = client.post(reverse("logout"), {"refresh": tokens["refresh"]}, format="json")

        assert response.status_code == 200
        session = AccountSession.objects.get(user=normal_user)
        assert session.revoked_at is not None


class TestPasswordResetAndEmailVerification:
    def test_password_reset_request_issues_token_for_existing_user(self, api_client, normal_user):
        response = api_client.post(reverse("password-reset"), {"email": normal_user.email}, format="json")

        assert response.status_code == 200
        assert PasswordResetToken.objects.filter(user=normal_user).exists()

    def test_password_reset_request_surfaces_debug_token_when_debug_is_on(self, api_client, normal_user, settings):
        settings.DEBUG = True

        response = api_client.post(reverse("password-reset"), {"email": normal_user.email}, format="json")

        assert response.status_code == 200
        token = response.json()["data"]["debug_password_reset_token"]
        assert PasswordResetToken.objects.get(user=normal_user).token == uuid.UUID(token)

    def test_password_reset_request_does_not_leak_unknown_email(self, api_client):
        response = api_client.post(reverse("password-reset"), {"email": "nobody@cybershield.local"}, format="json")

        assert response.status_code == 200
        assert response.json()["data"] == {}

    def test_password_reset_confirm_sets_new_password(self, api_client, normal_user):
        api_client.post(reverse("password-reset"), {"email": normal_user.email}, format="json")
        token = PasswordResetToken.objects.get(user=normal_user)

        response = api_client.post(
            reverse("password-reset-confirm"),
            {"token": str(token.token), "password": "BrandNewPassw0rd!", "password_confirm": "BrandNewPassw0rd!"},
            format="json",
        )

        assert response.status_code == 200
        normal_user.refresh_from_db()
        assert normal_user.check_password("BrandNewPassw0rd!")

    def test_password_reset_confirm_rejects_expired_or_unknown_token(self, api_client):
        response = api_client.post(
            reverse("password-reset-confirm"),
            {"token": "00000000-0000-0000-0000-000000000000", "password": "BrandNewPassw0rd!", "password_confirm": "BrandNewPassw0rd!"},
            format="json",
        )

        assert response.status_code == 400

    def test_verify_email_marks_user_verified(self, api_client, roles):
        user = User.objects.create_user(
            username="unverified", email="unverified@cybershield.local", password="Str0ngPassw0rd!", role=roles["normal_user"]
        )
        token = EmailVerificationToken.objects.create(user=user, expires_at=timezone.now() + timedelta(days=1))

        response = api_client.post(reverse("verify-email"), {"token": str(token.token)}, format="json")

        assert response.status_code == 200
        user.refresh_from_db()
        assert user.is_email_verified is True
