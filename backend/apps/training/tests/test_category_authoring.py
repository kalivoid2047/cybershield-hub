import pytest
from django.urls import reverse

from apps.training.models import LessonCategory

pytestmark = pytest.mark.django_db


def _payload(**overrides):
    payload = {"name": "Remote Work", "description": "Working away from the office.", "color": "#2ee59d", "icon": "Laptop", "order": 3}
    payload.update(overrides)
    return payload


class TestCreatingCategories:
    def test_admin_creates_a_category_with_a_generated_slug(self, admin_client):
        response = admin_client.post(reverse("lesson-categories-list"), _payload(), format="json")

        assert response.status_code == 201
        assert LessonCategory.objects.get(id=response.json()["id"]).slug == "remote-work"

    def test_duplicate_name_is_rejected(self, admin_client, lesson_category):
        response = admin_client.post(reverse("lesson-categories-list"), _payload(name=lesson_category.name), format="json")

        assert response.status_code == 400

    def test_colour_must_be_a_hex_value(self, admin_client):
        assert admin_client.post(reverse("lesson-categories-list"), _payload(color="blue"), format="json").status_code == 400

    def test_normal_user_cannot_create(self, user_client):
        assert user_client.post(reverse("lesson-categories-list"), _payload(), format="json").status_code == 403


class TestEditingCategories:
    def test_rename_keeps_the_existing_slug(self, admin_client, lesson_category):
        original_slug = lesson_category.slug

        response = admin_client.patch(reverse("lesson-categories-detail", args=[lesson_category.id]), {"name": "Phishing Basics"}, format="json")

        assert response.status_code == 200
        lesson_category.refresh_from_db()
        assert lesson_category.name == "Phishing Basics"
        assert lesson_category.slug == original_slug

    def test_can_update_colour_description_and_order(self, admin_client, lesson_category):
        response = admin_client.patch(
            reverse("lesson-categories-detail", args=[lesson_category.id]),
            {"color": "#ff5b7a", "description": "New text", "order": 9},
            format="json",
        )

        assert response.status_code == 200
        lesson_category.refresh_from_db()
        assert (lesson_category.color, lesson_category.description, lesson_category.order) == ("#ff5b7a", "New text", 9)

    def test_normal_user_cannot_edit(self, user_client, lesson_category):
        assert user_client.patch(reverse("lesson-categories-detail", args=[lesson_category.id]), {"name": "X"}, format="json").status_code == 403


class TestDeletingCategories:
    def test_empty_category_can_be_deleted(self, admin_client, lesson_category):
        response = admin_client.delete(reverse("lesson-categories-detail", args=[lesson_category.id]))

        assert response.status_code == 204
        assert not LessonCategory.objects.filter(id=lesson_category.id).exists()

    def test_category_with_lessons_is_refused_with_a_clear_message(self, admin_client, published_lesson):
        category = published_lesson.category

        response = admin_client.delete(reverse("lesson-categories-detail", args=[category.id]))

        assert response.status_code == 400
        assert "still has 1 lesson" in response.json()["error"]["message"]
        assert LessonCategory.objects.filter(id=category.id).exists()

    def test_normal_user_cannot_delete(self, user_client, lesson_category):
        assert user_client.delete(reverse("lesson-categories-detail", args=[lesson_category.id])).status_code == 403

    def test_list_reports_lesson_counts_in_order(self, admin_client, published_lesson):
        LessonCategory.objects.create(name="Aardvark", slug="aardvark", order=0)

        results = admin_client.get(reverse("lesson-categories-list")).json()["results"]

        counts = {item["name"]: item["lesson_count"] for item in results}
        assert counts[published_lesson.category.name] == 1
        assert counts["Aardvark"] == 0
