import pytest
from django.contrib.auth.models import AnonymousUser

from apps.common.permissions import IsCyberOfficer, IsOwnerOrOfficer, IsSystemAdmin, role_code

pytestmark = pytest.mark.django_db


class Req:
    def __init__(self, user, method="GET"):
        self.user = user
        self.method = method


def test_role_code_returns_none_for_anonymous_user():
    assert role_code(AnonymousUser()) is None


def test_role_code_returns_system_admin_for_superuser_even_without_a_role(django_user_model):
    superuser = django_user_model.objects.create_superuser(
        email="root@cybershield.local", username="root", password="Str0ngPassw0rd!"
    )
    assert superuser.role_id is None
    assert role_code(superuser) == "system_admin"


def test_role_code_reads_role_relation(normal_user):
    assert role_code(normal_user) == "normal_user"


def test_is_system_admin_permission(admin_user, normal_user):
    permission = IsSystemAdmin()
    assert permission.has_permission(Req(admin_user), None) is True
    assert permission.has_permission(Req(normal_user), None) is False


def test_is_cyber_officer_allows_admin_and_officer(admin_user, officer_user, normal_user):
    permission = IsCyberOfficer()
    assert permission.has_permission(Req(admin_user), None) is True
    assert permission.has_permission(Req(officer_user), None) is True
    assert permission.has_permission(Req(normal_user), None) is False


class FakeObj:
    def __init__(self, user=None, reporter=None):
        self.user = user
        self.reporter = reporter


def test_is_owner_or_officer_allows_officer_regardless_of_ownership(officer_user, normal_user):
    permission = IsOwnerOrOfficer()
    obj = FakeObj(user=normal_user)
    assert permission.has_object_permission(Req(officer_user), None, obj) is True


def test_is_owner_or_officer_allows_the_owner(normal_user):
    permission = IsOwnerOrOfficer()
    obj = FakeObj(user=normal_user)
    assert permission.has_object_permission(Req(normal_user), None, obj) is True


def test_is_owner_or_officer_denies_a_different_user(normal_user, other_normal_user):
    permission = IsOwnerOrOfficer()
    obj = FakeObj(user=other_normal_user)
    assert permission.has_object_permission(Req(normal_user), None, obj) is False


def test_is_owner_or_officer_falls_back_to_reporter_field(normal_user, other_normal_user):
    permission = IsOwnerOrOfficer()
    obj = FakeObj(reporter=normal_user)
    assert permission.has_object_permission(Req(normal_user), None, obj) is True
    assert permission.has_object_permission(Req(other_normal_user), None, obj) is False
