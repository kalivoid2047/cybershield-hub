// Plain data classes for the API payloads the app reads.
//
// Parsing is deliberately forgiving: DRF serialises decimals as strings and
// omits keys for null nested relations, so every accessor tolerates both.

typedef Json = Map<String, dynamic>;

num _num(dynamic value, [num fallback = 0]) {
  if (value is num) return value;
  if (value is String) return num.tryParse(value) ?? fallback;
  return fallback;
}

int _int(dynamic value, [int fallback = 0]) => _num(value, fallback).toInt();

String _str(dynamic value, [String fallback = '']) =>
    value is String ? value : fallback;

List<String> _strings(dynamic value) =>
    value is List ? value.map((e) => e.toString()).toList() : const [];

DateTime? _date(dynamic value) =>
    value is String ? DateTime.tryParse(value)?.toLocal() : null;

Json _map(dynamic value) =>
    value is Map<String, dynamic> ? value : <String, dynamic>{};

List<Json> _maps(dynamic value) =>
    value is List ? value.whereType<Map<String, dynamic>>().toList() : const [];

// -- users -------------------------------------------------------------------

class AppUser {
  AppUser({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.roleCode,
    required this.roleName,
    required this.organization,
    required this.department,
    required this.securityScore,
  });

  factory AppUser.fromJson(Json json) {
    final role = _map(json['role']);
    return AppUser(
      id: _int(json['id']),
      email: _str(json['email']),
      firstName: _str(json['first_name']),
      lastName: _str(json['last_name']),
      roleCode: _str(role['code']),
      roleName: _str(role['name']),
      organization: _str(json['organization']),
      department: _str(json['department']),
      securityScore: _int(json['security_score']),
    );
  }

  final int id;
  final String email;
  final String firstName;
  final String lastName;
  final String roleCode;
  final String roleName;
  final String organization;
  final String department;
  final int securityScore;

  String get fullName {
    final name = '$firstName $lastName'.trim();
    return name.isEmpty ? email : name;
  }

  String get initials {
    final letters = [
      firstName,
      lastName,
    ].where((s) => s.isNotEmpty).map((s) => s[0]).join();
    return (letters.isEmpty ? email[0] : letters).toUpperCase();
  }

  /// Admins get the SOC-facing incident views.
  bool get isStaff => roleCode == 'system_admin';
}

// -- training ----------------------------------------------------------------

class Lesson {
  Lesson({
    required this.id,
    required this.title,
    required this.slug,
    required this.summary,
    required this.content,
    required this.categoryName,
    required this.categoryColor,
    required this.estimatedMinutes,
    required this.difficulty,
    required this.tags,
    required this.progressPercent,
    required this.isBookmarked,
    required this.quizzes,
    this.quizRequired = false,
  });

  factory Lesson.fromJson(Json json) {
    final category = _map(json['category']);
    return Lesson(
      id: _int(json['id']),
      title: _str(json['title']),
      slug: _str(json['slug']),
      summary: _str(json['summary']),
      content: _str(json['content']),
      categoryName: _str(category['name']),
      categoryColor: _str(category['color'], '#22d3ee'),
      estimatedMinutes: _int(json['estimated_minutes']),
      difficulty: _str(json['difficulty']),
      tags: _strings(json['tags']),
      progressPercent: _int(json['progress_percent']),
      isBookmarked: json['is_bookmarked'] == true,
      quizzes: _maps(json['quizzes'])
          .map((q) => QuizRef(id: _int(q['id']), title: _str(q['title'])))
          .toList(),
      quizRequired: json['quiz_required'] == true,
    );
  }

  final int id;
  final String title;
  final String slug;
  final String summary;
  final String content;
  final String categoryName;
  final String categoryColor;
  final int estimatedMinutes;
  final String difficulty;
  final List<String> tags;
  final int progressPercent;
  final bool isBookmarked;
  final List<QuizRef> quizzes;

  /// True until the learner has finished an attempt at one of the lesson's quizzes.
  final bool quizRequired;

  bool get isComplete => progressPercent >= 100;

  Lesson copyWith({int? progressPercent, bool? isBookmarked}) => Lesson(
    id: id,
    title: title,
    slug: slug,
    summary: summary,
    content: content,
    categoryName: categoryName,
    categoryColor: categoryColor,
    estimatedMinutes: estimatedMinutes,
    difficulty: difficulty,
    tags: tags,
    progressPercent: progressPercent ?? this.progressPercent,
    isBookmarked: isBookmarked ?? this.isBookmarked,
    quizzes: quizzes,
    quizRequired: quizRequired,
  );
}

class QuizRef {
  QuizRef({required this.id, required this.title});
  final int id;
  final String title;
}

// -- quizzes -----------------------------------------------------------------

class QuizSummary {
  QuizSummary({
    required this.id,
    required this.title,
    required this.description,
    required this.timeLimitMinutes,
    required this.passScore,
    required this.maxAttempts,
    required this.questionCount,
    required this.bestScore,
    required this.attemptsUsed,
    required this.attemptsRemaining,
  });

  factory QuizSummary.fromJson(Json json) => QuizSummary(
    id: _int(json['id']),
    title: _str(json['title']),
    description: _str(json['description']),
    timeLimitMinutes: _int(json['time_limit_minutes'], 10),
    passScore: _int(json['pass_score'], 70),
    maxAttempts: _int(json['max_attempts']),
    questionCount: _int(json['question_count']),
    bestScore: json['best_score'] == null
        ? null
        : _num(json['best_score']).toDouble(),
    attemptsUsed: _int(json['attempts_used']),
    attemptsRemaining: json['attempts_remaining'] == null
        ? null
        : _int(json['attempts_remaining']),
  );

  final int id;
  final String title;
  final String description;
  final int timeLimitMinutes;
  final int passScore;
  final int maxAttempts;
  final int questionCount;
  final double? bestScore;
  final int attemptsUsed;

  /// `null` when the quiz has no attempt limit.
  final int? attemptsRemaining;

  bool get outOfAttempts => attemptsRemaining == 0;
}

class QuizQuestion {
  QuizQuestion({
    required this.id,
    required this.prompt,
    required this.competency,
    required this.answers,
  });

  factory QuizQuestion.fromJson(Json json) => QuizQuestion(
    id: _int(json['id']),
    prompt: _str(json['prompt']),
    competency: _str(json['competency']),
    answers: _maps(json['answers'])
        .map((a) => QuizAnswer(id: _int(a['id']), text: _str(a['text'])))
        .toList(),
  );

  final int id;
  final String prompt;
  final String competency;
  final List<QuizAnswer> answers;
}

class QuizAnswer {
  QuizAnswer({required this.id, required this.text});
  final int id;
  final String text;
}

class QuizDetail {
  QuizDetail({
    required this.id,
    required this.title,
    required this.description,
    required this.timeLimitMinutes,
    required this.passScore,
    required this.attemptsRemaining,
    required this.questions,
  });

  factory QuizDetail.fromJson(Json json) => QuizDetail(
    id: _int(json['id']),
    title: _str(json['title']),
    description: _str(json['description']),
    timeLimitMinutes: _int(json['time_limit_minutes'], 10),
    passScore: _int(json['pass_score'], 70),
    attemptsRemaining: json['attempts_remaining'] == null
        ? null
        : _int(json['attempts_remaining']),
    questions: _maps(json['questions']).map(QuizQuestion.fromJson).toList(),
  );

  final int id;
  final String title;
  final String description;
  final int timeLimitMinutes;
  final int passScore;

  /// `null` when the quiz has no attempt limit.
  final int? attemptsRemaining;
  final List<QuizQuestion> questions;
}

class QuizAttempt {
  QuizAttempt({
    required this.id,
    required this.quizTitle,
    required this.passScore,
    required this.score,
    required this.earnedPoints,
    required this.totalPoints,
    required this.passed,
    required this.durationSeconds,
    required this.startedAt,
    required this.completedAt,
    required this.attemptsRemaining,
    required this.lessonSlug,
    required this.lessonTitle,
    required this.answers,
    required this.weakness,
  });

  factory QuizAttempt.fromJson(Json json) {
    final weakness = <WeaknessEntry>[];
    _map(json['weakness_map']).forEach((competency, value) {
      final entry = _map(value);
      weakness.add(
        WeaknessEntry(
          competency: competency,
          correct: _int(entry['correct']),
          total: _int(entry['total']),
          score: _num(entry['score']).toDouble(),
        ),
      );
    });
    return QuizAttempt(
      id: _int(json['id']),
      quizTitle: _str(json['quiz_title']),
      passScore: _int(json['pass_score'], 70),
      score: _num(json['score']).toDouble(),
      earnedPoints: _int(json['earned_points']),
      totalPoints: _int(json['total_points']),
      passed: json['passed'] == true,
      durationSeconds: _int(json['duration_seconds']),
      startedAt: _date(json['started_at']),
      completedAt: _date(json['completed_at']),
      attemptsRemaining: json['attempts_remaining'] == null
          ? null
          : _int(json['attempts_remaining']),
      lessonSlug: json['lesson_slug'] is String
          ? json['lesson_slug'] as String
          : null,
      lessonTitle: json['lesson_title'] is String
          ? json['lesson_title'] as String
          : null,
      answers: _maps(json['answers']).map(AttemptAnswer.fromJson).toList(),
      weakness: weakness,
    );
  }

  final int id;
  final String quizTitle;
  final int passScore;
  final double score;
  final int earnedPoints;
  final int totalPoints;
  final bool passed;
  final int durationSeconds;
  final DateTime? startedAt;
  final DateTime? completedAt;
  final int? attemptsRemaining;
  final String? lessonSlug;
  final String? lessonTitle;
  final List<AttemptAnswer> answers;
  final List<WeaknessEntry> weakness;

  bool get isComplete => completedAt != null;
}

class AttemptAnswer {
  AttemptAnswer({
    required this.questionPrompt,
    required this.explanation,
    required this.selectedText,
    required this.correctText,
    required this.isCorrect,
  });

  factory AttemptAnswer.fromJson(Json json) => AttemptAnswer(
    questionPrompt: _str(json['question_prompt']),
    explanation: _str(json['explanation']),
    selectedText: json['selected_text'] is String
        ? json['selected_text'] as String
        : null,
    correctText: json['correct_answer_text'] is String
        ? json['correct_answer_text'] as String
        : null,
    isCorrect: json['is_correct'] == true,
  );

  final String questionPrompt;
  final String explanation;
  final String? selectedText;
  final String? correctText;
  final bool isCorrect;
}

class WeaknessEntry {
  WeaknessEntry({
    required this.competency,
    required this.correct,
    required this.total,
    required this.score,
  });
  final String competency;
  final int correct;
  final int total;
  final double score;
}

// -- phishing ----------------------------------------------------------------

class PhishingSimulation {
  PhishingSimulation({
    required this.id,
    required this.title,
    required this.scenario,
    required this.difficulty,
    required this.senderName,
    required this.senderEmail,
    required this.subject,
    required this.body,
    required this.urls,
    required this.redFlags,
    required this.attemptCount,
    required this.latestScore,
  });

  factory PhishingSimulation.fromJson(Json json) => PhishingSimulation(
    id: _int(json['id']),
    title: _str(json['title']),
    scenario: _str(json['scenario']),
    difficulty: _str(json['difficulty']),
    senderName: _str(json['sender_name']),
    senderEmail: _str(json['sender_email']),
    subject: _str(json['subject']),
    body: _str(json['body']),
    urls: _strings(json['urls']),
    redFlags: _strings(json['red_flags']),
    attemptCount: _int(json['attempt_count']),
    latestScore: json['latest_score'] == null
        ? null
        : _int(json['latest_score']),
  );

  final int id;
  final String title;
  final String scenario;
  final String difficulty;
  final String senderName;
  final String senderEmail;
  final String subject;
  final String body;
  final List<String> urls;
  final List<String> redFlags;
  final int attemptCount;
  final int? latestScore;
}

class PhishingResult {
  PhishingResult({
    required this.correct,
    required this.score,
    required this.expected,
    required this.redFlags,
    required this.trainingTip,
  });

  factory PhishingResult.fromJson(Json json) {
    final feedback = _map(json['feedback']);
    return PhishingResult(
      correct: json['correct'] == true,
      score: _int(json['score']),
      expected: _str(feedback['expected']),
      redFlags: _strings(feedback['red_flags']),
      trainingTip: _str(feedback['training_tip']),
    );
  }

  final bool correct;
  final int score;
  final String expected;
  final List<String> redFlags;
  final String trainingTip;
}

// -- incidents ---------------------------------------------------------------

class IncidentCategory {
  IncidentCategory({
    required this.id,
    required this.name,
    required this.defaultSeverity,
  });

  factory IncidentCategory.fromJson(Json json) => IncidentCategory(
    id: _int(json['id']),
    name: _str(json['name']),
    defaultSeverity: _str(json['default_severity'], 'medium'),
  );

  final int id;
  final String name;
  final String defaultSeverity;
}

class Incident {
  Incident({
    required this.id,
    required this.reference,
    required this.title,
    required this.categoryName,
    required this.severity,
    required this.status,
    required this.affectedSystem,
    required this.description,
    required this.isDraft,
    required this.createdAt,
    required this.occurredAt,
    required this.assignedTo,
    required this.updates,
  });

  factory Incident.fromJson(Json json) {
    final assigned = _map(json['assigned_to']);
    return Incident(
      id: _int(json['id']),
      reference: _str(json['reference_number']),
      title: _str(json['title']),
      categoryName: _str(_map(json['category'])['name']),
      severity: _str(json['severity'], 'medium'),
      status: _str(json['status'], 'open'),
      affectedSystem: _str(json['affected_system']),
      description: _str(json['description']),
      isDraft: json['is_draft'] == true,
      createdAt: _date(json['created_at']),
      occurredAt: _date(json['occurred_at']),
      assignedTo: assigned.isEmpty ? null : AppUser.fromJson(assigned).fullName,
      updates: _maps(json['updates']).map(IncidentUpdate.fromJson).toList(),
    );
  }

  final int id;
  final String reference;
  final String title;
  final String categoryName;
  final String severity;
  final String status;
  final String affectedSystem;
  final String description;
  final bool isDraft;
  final DateTime? createdAt;
  final DateTime? occurredAt;
  final String? assignedTo;
  final List<IncidentUpdate> updates;
}

class IncidentUpdate {
  IncidentUpdate({
    required this.actor,
    required this.statusTo,
    required this.note,
    required this.createdAt,
  });

  factory IncidentUpdate.fromJson(Json json) {
    final actor = _map(json['actor']);
    return IncidentUpdate(
      actor: actor.isEmpty ? 'System' : AppUser.fromJson(actor).fullName,
      statusTo: _str(json['status_to']),
      note: _str(json['note']),
      createdAt: _date(json['created_at']),
    );
  }

  final String actor;
  final String statusTo;
  final String note;
  final DateTime? createdAt;
}

// -- dashboard ---------------------------------------------------------------

class DashboardStats {
  DashboardStats({
    required this.securityScore,
    required this.lessonsCompleted,
    required this.lessonsTotal,
    required this.quizAverage,
    required this.phishingAverage,
    required this.openIncidents,
  });

  factory DashboardStats.fromJson(Json json) {
    final progress = _map(json['learning_progress']);
    return DashboardStats(
      securityScore: _int(json['security_score']),
      lessonsCompleted: _int(progress['completed']),
      lessonsTotal: _int(progress['total']),
      quizAverage: _num(json['quiz_average']).toDouble(),
      phishingAverage: _num(json['phishing_average']).toDouble(),
      openIncidents: _int(json['open_incidents']),
    );
  }

  final int securityScore;
  final int lessonsCompleted;
  final int lessonsTotal;
  final double quizAverage;
  final double phishingAverage;
  final int openIncidents;
}
