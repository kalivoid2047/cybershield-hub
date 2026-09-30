import pytest
from django.urls import reverse

from apps.training.models import Lesson

pytestmark = pytest.mark.django_db


def _payload(category, **overrides):
    payload = {
        "category_id": category.id,
        "title": "Securing Remote Work",
        "summary": "Keep home networks safe.",
        "content": "## Why it matters\n\nRemote work widens the attack surface.",
        "estimated_minutes": 7,
        "difficulty": "beginner",
        "tags": ["remote", " wifi ", ""],
        "is_published": False,
    }
    payload.update(overrides)
    return payload


class TestCreatingALesson:
    def test_admin_creates_a_draft_lesson_with_a_generated_slug(self, admin_client, lesson_category):
        response = admin_client.post(reverse("lessons-list"), _payload(lesson_category), format="json")

        assert response.status_code == 201
        lesson = Lesson.objects.get(id=response.json()["id"])
        assert lesson.slug == "securing-remote-work"
        assert lesson.is_published is False
        assert lesson.tags == ["remote", "wifi"]

    def test_same_title_gets_a_different_slug(self, admin_client, lesson_category):
        first = admin_client.post(reverse("lessons-list"), _payload(lesson_category), format="json").json()["slug"]
        second = admin_client.post(reverse("lessons-list"), _payload(lesson_category), format="json").json()["slug"]

        assert first != second

    def test_normal_user_cannot_create(self, user_client, lesson_category):
        assert user_client.post(reverse("lessons-list"), _payload(lesson_category), format="json").status_code == 403

    def test_drafts_are_hidden_from_learners_until_published(self, admin_client, user_client, lesson_category):
        slug = admin_client.post(reverse("lessons-list"), _payload(lesson_category), format="json").json()["slug"]

        assert user_client.get(reverse("lessons-detail", args=[slug])).status_code == 404

        admin_client.patch(reverse("lessons-detail", args=[slug]), {"is_published": True}, format="json")

        assert user_client.get(reverse("lessons-detail", args=[slug])).status_code == 200

    def test_tags_must_be_a_list_of_text(self, admin_client, lesson_category):
        response = admin_client.post(reverse("lessons-list"), _payload(lesson_category, tags="not-a-list"), format="json")

        assert response.status_code == 400
