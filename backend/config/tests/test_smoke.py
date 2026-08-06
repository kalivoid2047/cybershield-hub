import pytest
from django.urls import reverse

pytestmark = pytest.mark.django_db


def test_health_check_is_public_and_ok(api_client):
    response = api_client.get("/health/")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


def test_swagger_schema_endpoint_is_reachable(api_client):
    response = api_client.get(reverse("schema"))
    assert response.status_code == 200
