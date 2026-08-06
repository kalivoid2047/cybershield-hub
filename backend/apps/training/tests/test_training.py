import pytest
from django.urls import reverse

from apps.training.models import Lesson, LessonBookmark, LessonProgress

pytestmark = pytest.mark.django_db


class TestLessonVisibility:
    def test_anonymous_cannot_list_lessons(self, api_client):
        response = api_client.get(reverse("lessons-list"))
        assert response.status_code == 401

    def test_normal_user_only_sees_published_lessons(self, user_client, lesson_category):
        Lesson.objects.create(
            category=lesson_category, title="Draft Lesson", slug="draft-lesson",
            summary="s", content="c", is_published=False,
        )
        published = Lesson.objects.create(
            category=lesson_category, title="Published Lesson", slug="published-lesson",
            summary="s", content="c", is_published=True,
        )

        response = user_client.get(reverse("lessons-list"))

        assert response.status_code == 200
        slugs = {item["slug"] for item in response.json()["results"]}
        assert slugs == {published.slug}

    def test_admin_sees_unpublished_lessons_too(self, admin_client, lesson_category):
        Lesson.objects.create(
            category=lesson_category, title="Draft Lesson", slug="draft-lesson-2",
            summary="s", content="c", is_published=False,
        )

        response = admin_client.get(reverse("lessons-list"))

        assert response.status_code == 200
        assert response.json()["count"] >= 1

    def test_normal_user_cannot_create_lesson(self, user_client, lesson_category):
        payload = {
            "category_id": lesson_category.id, "title": "New", "slug": "new-lesson",
            "summary": "s", "content": "c",
        }
        response = user_client.post(reverse("lessons-list"), payload, format="json")
        assert response.status_code == 403


class TestLessonProgress:
    def test_progress_endpoint_updates_percentage(self, user_client, published_lesson):
        url = reverse("lessons-progress", args=[published_lesson.slug])

        response = user_client.post(url, {"progress_percent": 40}, format="json")

        assert response.status_code == 200
        assert response.json()["data"]["progress_percent"] == 40
        progress = LessonProgress.objects.get(lesson=published_lesson)
        assert progress.completed_at is None

    def test_progress_at_100_marks_lesson_complete(self, user_client, published_lesson):
        url = reverse("lessons-progress", args=[published_lesson.slug])

        user_client.post(url, {"progress_percent": 100}, format="json")

        progress = LessonProgress.objects.get(lesson=published_lesson)
        assert progress.completed_at is not None

    def test_complete_endpoint_forces_completion(self, user_client, published_lesson):
        url = reverse("lessons-complete", args=[published_lesson.slug])

        response = user_client.post(url)

        assert response.status_code == 200
        progress = LessonProgress.objects.get(lesson=published_lesson)
        assert progress.progress_percent == 100
        assert progress.completed_at is not None

    def test_progress_endpoint_rejects_out_of_range_percentage(self, user_client, published_lesson):
        url = reverse("lessons-progress", args=[published_lesson.slug])

        response = user_client.post(url, {"progress_percent": 150}, format="json")

        assert response.status_code == 400

    def test_mark_progress_clamps_values_outside_0_to_100(self, normal_user, published_lesson):
        progress = LessonProgress.objects.create(user=normal_user, lesson=published_lesson)

        progress.mark_progress(150)
        assert progress.progress_percent == 100

        progress.mark_progress(-20)
        assert progress.progress_percent == 0


class TestLessonBookmarks:
    def test_bookmark_and_remove_lesson(self, user_client, published_lesson, normal_user):
        url = reverse("lessons-bookmark", args=[published_lesson.slug])

        add_response = user_client.post(url)
        assert add_response.status_code == 200
        assert LessonBookmark.objects.filter(user=normal_user, lesson=published_lesson).exists()

        remove_response = user_client.delete(url)
        assert remove_response.status_code == 200
        assert not LessonBookmark.objects.filter(user=normal_user, lesson=published_lesson).exists()


class TestRecommendedLessons:
    def test_recommended_excludes_completed_lessons(self, user_client, normal_user, published_lesson):
        LessonProgress.objects.create(user=normal_user, lesson=published_lesson, completed_at=None)
        progress = LessonProgress.objects.get(user=normal_user, lesson=published_lesson)
        progress.mark_progress(100)

        response = user_client.get(reverse("lessons-recommended"))

        assert response.status_code == 200
        slugs = {item["slug"] for item in response.json()["data"]}
        assert published_lesson.slug not in slugs

    def test_recommended_includes_beginner_lessons_for_new_user(self, user_client, published_lesson):
        response = user_client.get(reverse("lessons-recommended"))

        assert response.status_code == 200
        slugs = {item["slug"] for item in response.json()["data"]}
        assert published_lesson.slug in slugs
