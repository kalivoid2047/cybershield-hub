from datetime import timedelta

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APIClient

from apps.incidents.models import IncidentCategory
from apps.phishing.models import PhishingSimulation
from apps.quizzes.models import AnswerOption, Question, Quiz
from apps.training.models import Lesson, LessonCategory
from apps.users.models import Role, User


# ---------------------------------------------------------------------------
# Test-environment hygiene
# ---------------------------------------------------------------------------


@pytest.fixture(autouse=True)
def _reset_throttle_cache():
    """DRF's rate throttles share a process-wide cache; without this, tests that hit
    an auth-scoped endpoint more than a handful of times fail with unrelated 429s
    once enough other tests have run before them."""
    cache.clear()
    yield
    cache.clear()


# ---------------------------------------------------------------------------
# Roles & users
# ---------------------------------------------------------------------------


@pytest.fixture
def roles(db):
    return {
        "normal_user": Role.objects.create(code=Role.NORMAL_USER, name="Normal User"),
        "system_admin": Role.objects.create(code=Role.SYSTEM_ADMIN, name="System Administrator"),
    }


def _make_user(roles, role_code, email, **extra):
    return User.objects.create_user(
        username=email.split("@")[0],
        email=email,
        password="Str0ngPassw0rd!",
        role=roles[role_code],
        is_active=True,
        is_email_verified=True,
        **extra,
    )


@pytest.fixture
def normal_user(roles):
    return _make_user(roles, "normal_user", "user@cybershield.local")


@pytest.fixture
def other_normal_user(roles):
    return _make_user(roles, "normal_user", "other-user@cybershield.local")


@pytest.fixture
def admin_user(roles):
    return _make_user(roles, "system_admin", "admin@cybershield.local", is_staff=True)


# ---------------------------------------------------------------------------
# API clients
# ---------------------------------------------------------------------------


@pytest.fixture
def api_client():
    return APIClient()


def _auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def user_client(normal_user):
    return _auth_client(normal_user)


@pytest.fixture
def admin_client(admin_user):
    return _auth_client(admin_user)


# ---------------------------------------------------------------------------
# Domain fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def lesson_category(db):
    return LessonCategory.objects.create(name="Phishing Awareness", slug="phishing-awareness")


@pytest.fixture
def published_lesson(lesson_category):
    return Lesson.objects.create(
        category=lesson_category,
        title="Spotting Phishing Emails",
        slug="spotting-phishing-emails",
        summary="Learn the basics.",
        content="Lesson content.",
        is_published=True,
    )


@pytest.fixture
def quiz(published_lesson):
    quiz = Quiz.objects.create(
        title="Phishing Basics Quiz",
        slug="phishing-basics-quiz",
        lesson=published_lesson,
        pass_score=50,
        is_active=True,
    )
    question = Question.objects.create(quiz=quiz, prompt="Is a spoofed sender address a red flag?", points=10)
    AnswerOption.objects.create(question=question, text="Yes", is_correct=True, order=0)
    AnswerOption.objects.create(question=question, text="No", is_correct=False, order=1)
    return quiz


@pytest.fixture
def phishing_simulation(db):
    return PhishingSimulation.objects.create(
        title="Fake Invoice",
        scenario="An urgent unpaid invoice email.",
        sender_name="Billing",
        sender_email="billing@suspicious-domain.example",
        subject="Overdue invoice - action required",
        body="Click here to pay immediately.",
        red_flags=["urgent language", "sender mismatch"],
        is_phishing=True,
        is_active=True,
    )


@pytest.fixture
def incident_category(db):
    return IncidentCategory.objects.create(name="Phishing", slug="phishing", default_severity="medium")

