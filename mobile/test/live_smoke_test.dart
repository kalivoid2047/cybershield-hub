// Live smoke test: drives the real ApiClient/CyberShieldApi against a running backend.
//
//   flutter test test/live_smoke_test.dart \n//     --dart-define=LIVE_API=1 --dart-define=API_BASE_URL=http://localhost:8000/api/v1
//
// Skipped unless LIVE_API is set. It registers a throwaway user, so it never touches
// the demo accounts' progress.
import 'dart:io';

import 'package:cybershield_hub/api/api_client.dart';
import 'package:cybershield_hub/api/cybershield_api.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';

const _live = String.fromEnvironment('LIVE_API');

void main() {
  if (_live.isEmpty) {
    test(
      'live smoke (skipped: pass --dart-define=LIVE_API=1)',
      () {},
      skip: true,
    );
    return;
  }

  TestWidgetsFlutterBinding.ensureInitialized();
  HttpOverrides.global =
      null; // the test binding stubs out real HTTP by default
  FlutterSecureStorage.setMockInitialValues({});
  final client = ApiClient();
  final api = CyberShieldApi(client);
  final stamp = DateTime.now().millisecondsSinceEpoch;
  final email = 'mobile-smoke-$stamp@example.test';
  const password = 'Sm0ke-Test-Pass-93!';

  test('register, login and profile', () async {
    await api.register(
      email: email,
      firstName: 'Smoke',
      lastName: 'Tester',
      password: password,
      organization: 'QA',
    );
    final user = await api.login(email, password);
    expect(user.email, email);
    expect(user.roleCode, 'normal_user');
    expect((await api.me()).firstName, 'Smoke');
    final updated = await api.updateProfile({'department': 'Testing'});
    expect(updated.department, 'Testing');
  });

  test('bad credentials surface a readable message', () async {
    final other = ApiClient();
    await expectLater(
      CyberShieldApi(other).login(email, 'wrong-password-123'),
      throwsA(
        isA<ApiException>().having(
          (e) => e.message,
          'message',
          contains('Invalid email or password'),
        ),
      ),
    );
  });

  test('dashboard, lessons, progress and bookmarks', () async {
    final stats = await api.dashboard();
    expect(stats.lessonsTotal, greaterThan(0));

    final lessons = await api.lessons();
    expect(lessons, isNotEmpty);
    final lesson = await api.lesson(lessons.first.slug);
    expect(lesson.content, isNotEmpty);
    expect(lesson.categoryName, isNotEmpty);

    expect(await api.recommendedLessons(), isNotEmpty);

    await api.setLessonProgress(lesson.slug, 25);
    expect((await api.lesson(lesson.slug)).progressPercent, 25);
    await api.setBookmark(lesson.slug, true);
    expect((await api.lesson(lesson.slug)).isBookmarked, isTrue);
    await api.setBookmark(lesson.slug, false);
    expect((await api.lesson(lesson.slug)).isBookmarked, isFalse);
    await api.completeLesson(lesson.slug);
    expect((await api.lesson(lesson.slug)).isComplete, isTrue);
  });

  test('quiz start, resume and submit', () async {
    final quizzes = await api.quizzes();
    expect(quizzes, isNotEmpty);
    final detail = await api.quiz(quizzes.first.id);
    expect(detail.questions, isNotEmpty);
    expect(detail.questions.first.answers.length, greaterThanOrEqualTo(2));

    final attempt = await api.startQuiz(detail.id);
    final resumed = await api.startQuiz(detail.id);
    expect(
      resumed.id,
      attempt.id,
      reason: 'starting again inside the time limit resumes the attempt',
    );
    expect(attempt.startedAt, isNotNull);

    // Answer only the first question: the rest must be graded as unanswered/incorrect.
    final first = detail.questions.first;
    final result = await api.submitQuiz(detail.id, attempt.id, {
      first.id: first.answers.first.id,
    });
    expect(result.isComplete, isTrue);
    expect(result.answers.length, detail.questions.length);
    expect(result.weakness, isNotEmpty);
    expect(result.totalPoints, greaterThan(0));

    expect((await api.quizAttempts()).map((a) => a.id), contains(result.id));
  });

  test('phishing simulation submit returns feedback', () async {
    final sims = await api.simulations();
    expect(sims, isNotEmpty);
    final sim = sims.first;
    final result = await api.submitSimulation(
      sim.id,
      classification: 'suspicious',
      flags: sim.redFlags.take(1).toList(),
      inspectedUrls: sim.urls.take(1).toList(),
    );
    expect(result.score, inInclusiveRange(0, 100));
    expect(['safe', 'suspicious'], contains(result.expected));
  });

  test('report and read an incident', () async {
    final categories = await api.incidentCategories();
    expect(categories, isNotEmpty);
    final created = await api.reportIncident(
      title: 'Smoke test incident',
      categoryId: categories.first.id,
      severity: 'low',
      description: 'Created by the mobile live smoke test.',
      affectedSystem: 'Test laptop',
      occurredAt: DateTime.now().subtract(const Duration(hours: 1)),
    );
    expect(created.id, greaterThan(0));

    final list = await api.incidents();
    expect(list.map((i) => i.id), contains(created.id));
    final detail = await api.incident(created.id);
    expect(detail.title, 'Smoke test incident');
    expect(detail.updates, isNotEmpty);
    expect(detail.reference, isNotEmpty);
  });

  test('change password then log in with the new one', () async {
    const next = 'An0ther-Smoke-Pass-77!';
    await api.changePassword(password, next);
    final fresh = CyberShieldApi(ApiClient());
    expect((await fresh.login(email, next)).email, email);
  });

  test('token refresh recovers from an expired access token', () async {
    // Corrupt only the access token; the refresh token is still valid.
    await client.saveTokens(access: 'not-a-real-token');
    final me = await api.me();
    expect(me.email, email);
  });

  test('logout revokes the refresh token', () async {
    final refresh = client.refreshToken!;
    await api.logout();
    await client.clearTokens();
    await client.saveTokens(access: 'x', refresh: refresh);
    var expired = false;
    client.onSessionExpired = () => expired = true;
    await expectLater(api.me(), throwsA(isA<ApiException>()));
    expect(expired, isTrue);
  });
}
