"""Integrity checks for the seeded cybersecurity curriculum."""
import re
from collections import Counter

import pytest
from django.core.management import call_command
from django.urls import reverse
from rest_framework.test import APIClient

from apps.quizzes.models import Question, Quiz, QuizAttempt
from apps.quizzes.services import grade_quiz_attempt
from apps.training.content import LESSONS, QUIZZES
from apps.training.models import Lesson, LessonCategory
from apps.users.models import User

CATEGORY_SLUGS = {
    "phishing", "password-security", "malware", "social-engineering",
    "safe-browsing", "mobile-security", "data-privacy", "email-security",
}
DIFFICULTIES = {value for value, _ in Lesson.DIFFICULTY_CHOICES}
SLUG_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")


class TestLessonContentDefinitions:
    def test_slugs_and_titles_are_unique_and_valid(self):
        slugs = [lesson["slug"] for lesson in LESSONS]
        titles = [lesson["title"] for lesson in LESSONS]
        assert len(slugs) == len(set(slugs))
        assert len(titles) == len(set(titles))
        assert all(SLUG_RE.match(slug) for slug in slugs)

    def test_every_category_has_at_least_two_lessons(self):
        counts = Counter(lesson["category"] for lesson in LESSONS)
        assert set(counts) == CATEGORY_SLUGS
        assert all(count >= 2 for count in counts.values()), counts

    def test_difficulty_levels_are_valid_and_cover_full_range(self):
        levels = {lesson["difficulty"] for lesson in LESSONS}
        assert levels <= DIFFICULTIES
        assert levels == DIFFICULTIES

    @pytest.mark.parametrize("lesson", LESSONS, ids=lambda lesson: lesson["slug"])
    def test_lesson_is_substantive(self, lesson):
        assert len(lesson["summary"]) >= 40
        assert len(lesson["content"].split()) >= 180
        assert lesson["content"].count("## ") >= 3, "lessons should be structured with sections"
        assert lesson["tags"], "lessons need tags for search"
        assert 5 <= lesson["minutes"] <= 30
        assert len(lesson["title"]) <= 220 and len(lesson["slug"]) <= 240

    @pytest.mark.parametrize("lesson", LESSONS, ids=lambda lesson: lesson["slug"])
    def test_lesson_has_no_raw_html(self, lesson):
        # Content is rendered as Markdown; raw tags would be an XSS foothold.
        assert not re.search(r"<\s*/?\s*(script|iframe|img|a|style)\b", lesson["content"], re.I)

    def test_preserves_original_seeded_lesson_slugs(self):
        slugs = {lesson["slug"] for lesson in LESSONS}
        assert {
            "phishing-red-flags-in-10-minutes",
            "password-managers-and-mfa",
            "handling-sensitive-data",
            "malware-intake-basics",
        } <= slugs


class TestQuizContentDefinitions:
    def test_quiz_slugs_are_unique_and_valid(self):
        slugs = [quiz["slug"] for quiz in QUIZZES]
        assert len(slugs) == len(set(slugs))
        assert all(SLUG_RE.match(slug) for slug in slugs)

    def test_every_lesson_has_a_quiz(self):
        """Every lesson page shows a Take quiz button, so each lesson needs at least one quiz."""
        assert {lesson["slug"] for lesson in LESSONS} <= {quiz["lesson"] for quiz in QUIZZES}

    def test_every_category_has_a_quiz(self):
        assert {quiz["category"] for quiz in QUIZZES} == CATEGORY_SLUGS

    def test_quizzes_reference_existing_lessons_in_same_category(self):
        lessons = {lesson["slug"]: lesson for lesson in LESSONS}
        for quiz in QUIZZES:
            assert quiz["lesson"] in lessons, quiz["slug"]
            assert lessons[quiz["lesson"]]["category"] == quiz["category"], quiz["slug"]

    @pytest.mark.parametrize("quiz", QUIZZES, ids=lambda quiz: quiz["slug"])
    def test_quiz_settings_are_sane(self, quiz):
        assert len(quiz["questions"]) >= 5
        assert 50 <= quiz["pass_score"] <= 100
        assert 5 <= quiz["time_limit_minutes"] <= 60
        assert quiz["description"]

    @pytest.mark.parametrize("quiz", QUIZZES, ids=lambda quiz: quiz["slug"])
    def test_questions_are_well_formed(self, quiz):
        prompts = [question[0] for question in quiz["questions"]]
        assert len(prompts) == len(set(prompts)), "duplicate question prompt"
        for prompt, competency, explanation, answers, correct_index in quiz["questions"]:
            assert prompt.endswith(("?", ":", ".")), prompt
            assert competency.strip()
            assert len(explanation) >= 30, f"explanation too short: {prompt}"
            assert len(answers) == 4, f"expected 4 options: {prompt}"
            assert len(set(answers)) == len(answers), f"duplicate options: {prompt}"
            assert isinstance(correct_index, int) and 0 <= correct_index < len(answers), prompt

    def test_correct_answers_are_not_always_in_the_same_position(self):
        positions = Counter(q[4] for quiz in QUIZZES for q in quiz["questions"])
        assert len(positions) >= 3, positions
        assert max(positions.values()) / sum(positions.values()) < 0.6, positions


    def test_correct_answer_is_not_systematically_the_longest_option(self):
        """Guards against a test-taking giveaway where the right option is always the wordiest."""
        total = strictly_longest = 0
        for quiz in QUIZZES:
            for _, _, _, answers, correct in quiz["questions"]:
                total += 1
                others = [len(text) for index, text in enumerate(answers) if index != correct]
                strictly_longest += len(answers[correct]) > max(others)
        assert strictly_longest / total < 0.4, f"{strictly_longest}/{total} correct answers are strictly the longest"


@pytest.mark.django_db
class TestSeededCurriculum:
    @pytest.fixture
    def seeded(self):
        call_command("seed_demo")

    @pytest.fixture
    def learner(self, seeded):
        return User.objects.get(email="user@cybershield.local")

    @pytest.fixture
    def learner_client(self, learner):
        client = APIClient()
        client.force_authenticate(user=learner)
        return client

    def test_seed_creates_all_lessons_and_quizzes(self, seeded):
        assert LessonCategory.objects.count() == len(CATEGORY_SLUGS)
        assert Lesson.objects.filter(is_published=True).count() == len(LESSONS)
        assert Quiz.objects.filter(is_active=True).count() == len(QUIZZES)

    def test_seed_is_idempotent(self, seeded):
        call_command("seed_demo")
        assert Lesson.objects.count() == len(LESSONS)
        assert Quiz.objects.count() == len(QUIZZES)
        expected_questions = sum(len(quiz["questions"]) for quiz in QUIZZES)
        assert Question.objects.count() == expected_questions

    def test_each_seeded_question_has_exactly_one_correct_answer(self, seeded):
        for quiz in Quiz.objects.prefetch_related("questions__answers"):
            for question in quiz.questions.all():
                correct = [answer for answer in question.answers.all() if answer.is_correct]
                assert len(correct) == 1, f"{quiz.slug}: {question.prompt}"

    def test_quizzes_are_linked_to_lessons(self, seeded):
        for quiz in Quiz.objects.all():
            assert quiz.lesson is not None, quiz.slug
            assert quiz.category_id == quiz.lesson.category_id, quiz.slug

    def test_perfect_attempt_passes_every_quiz(self, learner):
        for quiz in Quiz.objects.all():
            attempt = QuizAttempt.objects.create(user=learner, quiz=quiz)
            submission = [
                {"question_id": q.id, "answer_id": q.answers.get(is_correct=True).id}
                for q in quiz.questions.all()
            ]
            graded = grade_quiz_attempt(attempt, submission)
            assert graded.score == 100 and graded.passed, quiz.slug

    def test_blank_attempt_fails_every_quiz_and_reports_weaknesses(self, learner):
        for quiz in Quiz.objects.all():
            attempt = QuizAttempt.objects.create(user=learner, quiz=quiz)
            graded = grade_quiz_attempt(attempt, [])
            assert graded.score == 0 and not graded.passed, quiz.slug
            assert graded.weakness_map, quiz.slug
            assert graded.recommendations, quiz.slug

    def test_learner_can_read_seeded_lesson_content_via_api(self, learner_client):
        response = learner_client.get(reverse("lessons-detail", args=["ransomware-prevention-and-response"]))
        assert response.status_code == 200
        body = response.json()
        assert body["difficulty"] == "advanced"
        assert "3-2-1" in body["content"]

    def test_category_filtering_returns_only_matching_lessons(self, learner_client):
        response = learner_client.get(reverse("lessons-list"), {"category__slug": "phishing"})
        assert response.status_code == 200
        results = response.json()["results"]
        assert len(results) >= 3
