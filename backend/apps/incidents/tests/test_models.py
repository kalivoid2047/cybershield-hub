import pytest
from django.utils import timezone

from apps.incidents.models import Incident

pytestmark = pytest.mark.django_db


@pytest.mark.parametrize(
    "severity,status,expected",
    [
        (Incident.LOW, Incident.OPEN, 30),
        (Incident.MEDIUM, Incident.OPEN, 55),
        (Incident.HIGH, Incident.OPEN, 80),
        (Incident.CRITICAL, Incident.OPEN, 100),
        (Incident.CRITICAL, Incident.CLOSED, 65),
    ],
)
def test_priority_score_combines_severity_and_status_weights(incident_category, normal_user, severity, status, expected):
    incident = Incident.objects.create(
        title="t",
        category=incident_category,
        severity=severity,
        status=status,
        description="d",
        occurred_at=timezone.now(),
        reporter=normal_user,
    )
    assert incident.priority_score == expected


def test_reference_number_is_generated_once_and_stable(incident_category, normal_user):
    incident = Incident.objects.create(
        title="t", category=incident_category, description="d", occurred_at=timezone.now(), reporter=normal_user
    )
    first_reference = incident.reference_number
    assert first_reference.startswith("INC-")

    incident.title = "updated title"
    incident.save()

    incident.refresh_from_db()
    assert incident.reference_number == first_reference


def test_submitted_at_only_set_when_not_a_draft(incident_category, normal_user):
    draft = Incident.objects.create(
        title="t", category=incident_category, description="d", occurred_at=timezone.now(), reporter=normal_user, is_draft=True
    )
    assert draft.submitted_at is None

    submitted = Incident.objects.create(
        title="t2", category=incident_category, description="d", occurred_at=timezone.now(), reporter=normal_user, is_draft=False
    )
    assert submitted.submitted_at is not None
