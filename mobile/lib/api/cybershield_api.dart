import '../models/models.dart';
import 'api_client.dart';

/// Typed wrappers over the REST endpoints the app uses (see docs/api_endpoints.md).
class CyberShieldApi {
  CyberShieldApi(this.client);

  final ApiClient client;

  // -- auth ------------------------------------------------------------------

  Future<AppUser> login(String email, String password) async {
    final data = await client.post(
      '/auth/login/',
      body: {'email': email, 'password': password},
      auth: false,
    );
    await client.saveTokens(
      access: data['access'] as String,
      refresh: data['refresh'] as String,
    );
    return AppUser.fromJson(data['user'] as Json);
  }

  Future<void> register({
    required String email,
    required String firstName,
    required String lastName,
    required String password,
    String organization = '',
    String department = '',
  }) async {
    await client.post(
      '/auth/register/',
      auth: false,
      body: {
        'email': email,
        // The backend requires a username; the web app derives it from the email too.
        'username': email.split('@').first,
        'first_name': firstName,
        'last_name': lastName,
        'organization': organization,
        'department': department,
        'password': password,
        'password_confirm': password,
      },
    );
  }

  Future<AppUser> me() async =>
      AppUser.fromJson(await client.get('/auth/me/') as Json);

  Future<AppUser> updateProfile(Json changes) async =>
      AppUser.fromJson(await client.patch('/auth/me/', body: changes) as Json);

  Future<void> changePassword(String current, String next) async {
    await client.post(
      '/auth/change-password/',
      body: {
        'current_password': current,
        'password': next,
        'password_confirm': next,
      },
    );
  }

  Future<void> logout() async {
    final refresh = client.refreshToken;
    if (refresh == null) return;
    await client.post('/auth/logout/', body: {'refresh': refresh});
  }

  // -- dashboard -------------------------------------------------------------

  Future<DashboardStats> dashboard() async =>
      DashboardStats.fromJson(await client.get('/analytics/me/') as Json);

  // -- training --------------------------------------------------------------

  Future<List<Lesson>> lessons() async =>
      (await client.getList('/training/lessons/'))
          .map(Lesson.fromJson)
          .toList();

  Future<List<Lesson>> recommendedLessons() async {
    final data = await client.get('/training/lessons/recommended/');
    return (data is List ? data : const [])
        .whereType<Json>()
        .map(Lesson.fromJson)
        .toList();
  }

  Future<Lesson> lesson(String slug) async =>
      Lesson.fromJson(await client.get('/training/lessons/$slug/') as Json);

  Future<void> setLessonProgress(String slug, int percent) async {
    await client.post(
      '/training/lessons/$slug/progress/',
      body: {'progress_percent': percent},
    );
  }

  Future<void> completeLesson(String slug) async {
    await client.post('/training/lessons/$slug/complete/');
  }

  Future<void> setBookmark(String slug, bool bookmarked) async {
    if (bookmarked) {
      await client.post('/training/lessons/$slug/bookmark/');
    } else {
      await client.delete('/training/lessons/$slug/bookmark/');
    }
  }

  // -- quizzes ---------------------------------------------------------------

  Future<List<QuizSummary>> quizzes() async =>
      (await client.getList('/quizzes/quizzes/'))
          .map(QuizSummary.fromJson)
          .toList();

  Future<QuizDetail> quiz(int id) async =>
      QuizDetail.fromJson(await client.get('/quizzes/quizzes/$id/') as Json);

  /// Starts (or resumes) an attempt; the server enforces the attempt limit.
  Future<QuizAttempt> startQuiz(int id) async => QuizAttempt.fromJson(
    await client.post('/quizzes/quizzes/$id/start/') as Json,
  );

  Future<QuizAttempt> submitQuiz(
    int quizId,
    int attemptId,
    Map<int, int> answers,
  ) async {
    final data = await client.post(
      '/quizzes/quizzes/$quizId/submit/',
      body: {
        'attempt_id': attemptId,
        'answers': [
          for (final entry in answers.entries)
            {'question_id': entry.key, 'answer_id': entry.value},
        ],
      },
    );
    return QuizAttempt.fromJson(data as Json);
  }

  Future<List<QuizAttempt>> quizAttempts() async => (await client.getList(
    '/quizzes/attempts/',
    query: {'ordering': '-completed_at'},
  )).map(QuizAttempt.fromJson).where((a) => a.isComplete).toList();

  // -- phishing --------------------------------------------------------------

  Future<List<PhishingSimulation>> simulations() async =>
      (await client.getList('/phishing/simulations/'))
          .map(PhishingSimulation.fromJson)
          .toList();

  Future<PhishingResult> submitSimulation(
    int id, {
    required String classification,
    required List<String> flags,
    required List<String> inspectedUrls,
  }) async {
    final data = await client.post(
      '/phishing/simulations/$id/submit/',
      body: {
        'classification': classification,
        'selected_flags': flags,
        'inspected_urls': inspectedUrls,
      },
    );
    return PhishingResult.fromJson(data as Json);
  }

  // -- incidents -------------------------------------------------------------

  Future<List<Incident>> incidents() async =>
      (await client.getList('/incidents/incidents/'))
          .map(Incident.fromJson)
          .toList();

  Future<Incident> incident(int id) async =>
      Incident.fromJson(await client.get('/incidents/incidents/$id/') as Json);

  Future<List<IncidentCategory>> incidentCategories() async =>
      (await client.getList('/incidents/categories/'))
          .map(IncidentCategory.fromJson)
          .toList();

  Future<Incident> reportIncident({
    required String title,
    required int categoryId,
    required String severity,
    required String description,
    required String affectedSystem,
    required DateTime occurredAt,
  }) async {
    final data = await client.post(
      '/incidents/incidents/',
      body: {
        'title': title,
        'category_id': categoryId,
        'severity': severity,
        'description': description,
        'affected_system': affectedSystem,
        'occurred_at': occurredAt.toUtc().toIso8601String(),
        'is_draft': false,
      },
    );
    return Incident.fromJson(data as Json);
  }

  // -- alerts ----------------------------------------------------------------

  Future<List<AppNotification>> notifications() async =>
      (await client.getList('/alerts/notifications/'))
          .map(AppNotification.fromJson)
          .toList();

  Future<void> markNotificationRead(int id) async {
    await client.post('/alerts/notifications/$id/read/');
  }

  Future<void> markAllNotificationsRead() async {
    await client.post('/alerts/notifications/read_all/');
  }
}
