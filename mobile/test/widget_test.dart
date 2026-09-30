import 'package:flutter_test/flutter_test.dart';
import 'package:cybershield_hub/models/models.dart';

void main() {
  test('Lesson parses DRF payloads with missing/nullable fields', () {
    final lesson = Lesson.fromJson({
      'id': 3,
      'title': 'Spot phishing',
      'slug': 'spot-phishing',
      'category': {'name': 'Email', 'color': '#38bdf8'},
      'progress_percent': 100,
      'quizzes': [
        {'id': 9, 'title': 'Phishing quiz', 'slug': 'phishing-quiz'},
      ],
    });
    expect(lesson.isComplete, isTrue);
    expect(lesson.quizzes.single.id, 9);
    expect(lesson.summary, '');
    expect(lesson.tags, isEmpty);
  });

  test('QuizAttempt reads decimal strings and the weakness map', () {
    final attempt = QuizAttempt.fromJson({
      'id': 1,
      'score': '66.67',
      'passed': false,
      'pass_score': 70,
      'completed_at': '2026-09-30T10:00:00Z',
      'weakness_map': {
        'Passwords': {'correct': 1, 'total': 2, 'score': 50.0},
      },
      'answers': [],
    });
    expect(attempt.score, closeTo(66.67, 0.001));
    expect(attempt.isComplete, isTrue);
    expect(attempt.weakness.single.competency, 'Passwords');
    expect(attempt.lessonSlug, isNull);
  });
}
