// Walks the whole signed-in app on a phone-sized surface against canned API
// responses, so layout overflows, provider misuse and navigation bugs fail here
// instead of on a device.
import 'dart:convert';

import 'package:cybershield_hub/api/api_client.dart';
import 'package:cybershield_hub/api/cybershield_api.dart';
import 'package:cybershield_hub/main.dart';
import 'package:cybershield_hub/state/auth_state.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';

const _user = {
  'id': 7,
  'email': 'user@cybershield.local',
  'first_name': 'Una',
  'last_name': 'User',
  'role': {'code': 'normal_user', 'name': 'Normal User'},
  'organization': 'Acme',
  'department': 'Ops',
  'security_score': 62,
};

const _lesson = {
  'id': 1,
  'title': 'Spotting phishing emails',
  'slug': 'spotting-phishing-emails',
  'summary': 'Learn the tell-tale signs.',
  'content': '## Why it matters\n\nPhishing is the **top** attack vector.\n\n- Check the sender\n- Hover links\n\n> Stop and think.\n\n| Sign | Meaning |\n| --- | --- |\n| Urgency | Pressure |',
  'category': {'id': 1, 'name': 'Email', 'color': '#38bdf8'},
  'estimated_minutes': 8,
  'difficulty': 'beginner',
  'tags': ['email'],
  'progress_percent': 0,
  'is_bookmarked': false,
  'quizzes': [
    {'id': 5, 'title': 'Phishing basics', 'slug': 'phishing-basics'},
  ],
};

const _quizSummary = {
  'id': 5,
  'title': 'Phishing basics',
  'slug': 'phishing-basics',
  'description': 'Five quick questions.',
  'time_limit_minutes': 10,
  'pass_score': 70,
  'max_attempts': 3,
  'question_count': 2,
  'best_score': null,
  'attempts_used': 0,
  'attempts_remaining': 3,
};

final _quizDetail = {
  ..._quizSummary,
  'questions': [
    {
      'id': 11,
      'prompt': 'What should you check first?',
      'competency': 'Email',
      'points': 1,
      'order': 0,
      'answers': [
        {'id': 111, 'text': 'The sender address', 'order': 0},
        {'id': 112, 'text': 'The font', 'order': 1},
      ],
    },
    {
      'id': 12,
      'prompt': 'A link says login-secure.example.com. Safe?',
      'competency': 'Links',
      'points': 1,
      'order': 1,
      'answers': [
        {'id': 121, 'text': 'Yes', 'order': 0},
        {'id': 122, 'text': 'No', 'order': 1},
      ],
    },
  ],
};

const _attemptStart = {
  'id': 90,
  'quiz': 5,
  'quiz_title': 'Phishing basics',
  'pass_score': 70,
  'started_at':
      '2099-01-01T00:00:00Z', // far future: the timer never expires mid-test
  'score': '0.00',
  'answers': [],
};

const _attemptDone = {
  'id': 90,
  'quiz': 5,
  'quiz_title': 'Phishing basics',
  'pass_score': 70,
  'lesson_slug': 'spotting-phishing-emails',
  'lesson_title': 'Spotting phishing emails',
  'attempts_remaining': 2,
  'score': '50.00',
  'total_points': 2,
  'earned_points': 1,
  'passed': false,
  'completed_at': '2026-09-30T10:00:00Z',
  'weakness_map': {
    'Email': {'correct': 1, 'total': 1, 'score': 100.0},
    'Links': {'correct': 0, 'total': 1, 'score': 0.0},
  },
  'answers': [
    {
      'id': 1,
      'question_prompt': 'What should you check first?',
      'explanation': '',
      'selected_text': 'The sender address',
      'correct_answer_text': 'The sender address',
      'is_correct': true,
    },
    {
      'id': 2,
      'question_prompt': 'A link says login-secure.example.com. Safe?',
      'explanation': 'Look-alike domain.',
      'selected_text': 'Yes',
      'correct_answer_text': 'No',
      'is_correct': false,
    },
  ],
};

const _sim = {
  'id': 3,
  'title': 'Payroll update request',
  'scenario': 'An email about your payroll details.',
  'difficulty': 'medium',
  'sender_name': 'HR Payroll',
  'sender_email': 'hr@company.com',
  'subject': 'Urgent: confirm your bank details',
  'body': 'Click the link within 24 hours or lose access.',
  'urls': ['http://micros0ft-login.com/verify'],
  'red_flags': ['Creates urgency', 'Sender domain mismatch'],
  'attempt_count': 0,
  'latest_score': null,
};

const _incident = {
  'id': 21,
  'reference_number': 'INC-0021',
  'title': 'Suspicious attachment',
  'category': {'id': 1, 'name': 'Phishing', 'default_severity': 'high'},
  'severity': 'high',
  'status': 'investigating',
  'is_draft': false,
  'description': 'I received a strange invoice.',
  'affected_system': 'Laptop',
  'occurred_at': '2026-09-29T09:00:00Z',
  'created_at': '2026-09-29T09:30:00Z',
  'assigned_to': {
    'id': 2,
    'email': 'officer@cybershield.local',
    'first_name': 'Olive',
    'last_name': 'Officer',
    'role': {'code': 'cybersecurity_officer', 'name': 'Officer'},
  },
  'updates': [
    {
      'id': 1,
      'actor': _user,
      'status_to': 'open',
      'note': 'Incident submitted.',
      'created_at': '2026-09-29T09:30:00Z',
    },
  ],
};

const _notification = {
  'id': 4,
  'is_read': false,
  'created_at': '2026-09-30T08:00:00Z',
  'alert': {
    'id': 1,
    'title': 'Phishing wave targeting finance',
    'body': 'Do not open unexpected invoices.',
    'priority': 'high',
    'alert_type': 'threat_advisory',
  },
};

http.Response _json(Object body, [int status = 200]) => http.Response(
  jsonEncode(body),
  status,
  headers: {'content-type': 'application/json'},
);
http.Response _ok(Object data) =>
    _json({'success': true, 'message': 'OK', 'data': data});
http.Response _page(List<Object> results) => _json({
  'success': true,
  'count': results.length,
  'next': null,
  'previous': null,
  'results': results,
});

Future<http.Response> _route(http.Request request) async {
  final path = request.url.path.replaceFirst('/api/v1', '');
  final method = request.method;
  switch ('$method $path') {
    case 'POST /auth/login/':
      return _ok({'access': 'a', 'refresh': 'r', 'user': _user});
    case 'GET /auth/me/':
      return _ok(_user);
    case 'GET /analytics/me/':
      return _ok({
        'security_score': 62,
        'learning_progress': {'completed': 1, 'total': 4},
        'quiz_average': 71.5,
        'phishing_average': 40,
        'open_incidents': 1,
        'unread_notifications': 1,
      });
    case 'GET /training/lessons/recommended/':
      return _ok([_lesson]);
    case 'GET /training/lessons/':
      return _page([_lesson]);
    case 'GET /training/lessons/spotting-phishing-emails/':
      return _ok(_lesson);
    case 'POST /training/lessons/spotting-phishing-emails/complete/':
      return _ok({});
    case 'POST /training/lessons/spotting-phishing-emails/bookmark/':
      return _ok({});
    case 'GET /quizzes/quizzes/':
      return _page([_quizSummary]);
    case 'GET /quizzes/quizzes/5/':
      return _ok(_quizDetail);
    case 'POST /quizzes/quizzes/5/start/':
      return _ok(_attemptStart);
    case 'POST /quizzes/quizzes/5/submit/':
      return _ok(_attemptDone);
    case 'GET /phishing/simulations/':
      return _page([_sim]);
    case 'POST /phishing/simulations/3/submit/':
      return _ok({
        'id': 1,
        'correct': true,
        'score': 85,
        'feedback': {
          'expected': 'suspicious',
          'red_flags': _sim['red_flags'],
          'training_tip': 'Always check the sender domain.',
        },
      });
    case 'GET /incidents/incidents/':
      return _page([_incident]);
    case 'GET /incidents/incidents/21/':
      return _ok(_incident);
    case 'GET /incidents/categories/':
      return _page([_incident['category']!]);
    case 'GET /alerts/notifications/':
      return _page([_notification]);
    case 'POST /alerts/notifications/4/read/':
      return _ok({});
    case 'POST /alerts/notifications/read_all/':
      return _ok({});
  }
  return _json({
    'success': false,
    'error': {'message': 'Unmocked: $method $path'},
  }, 404);
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  Future<void> pumpApp(WidgetTester tester) async {
    FlutterSecureStorage.setMockInitialValues({});
    tester.view.physicalSize = const Size(400, 850);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.reset);

    final client = ApiClient(client: MockClient(_route));
    final api = CyberShieldApi(client);
    final auth = AuthState(client, api);
    await tester.pumpWidget(
      CyberShieldApp(client: client, api: api, auth: auth),
    );
    await auth.bootstrap();
    await tester.pumpAndSettle();
  }

  Future<void> signIn(WidgetTester tester) async {
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Email'),
      'user@cybershield.local',
    );
    await tester.enterText(
      find.widgetWithText(TextFormField, 'Password'),
      'CyberShield123!',
    );
    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();
  }

  Future<void> goTab(WidgetTester tester, String label) async {
    await tester.tap(
      find.descendant(
        of: find.byType(NavigationBar),
        matching: find.text(label),
      ),
    );
    await tester.pumpAndSettle();
  }

  testWidgets('sign in shows the dashboard with stats and recommendations', (
    tester,
  ) async {
    await pumpApp(tester);
    expect(
      find.text('Sign in to continue your security training.'),
      findsOneWidget,
    );

    await signIn(tester);

    expect(find.text('Una'), findsOneWidget);
    expect(find.text('Security score'), findsOneWidget);
    expect(find.text('62'), findsOneWidget);
    expect(find.text('1 of 4 lessons completed'), findsOneWidget);
    expect(find.text('Spotting phishing emails'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('login validates empty fields and shows API errors', (
    tester,
  ) async {
    await pumpApp(tester);
    await tester.tap(find.text('Sign in'));
    await tester.pumpAndSettle();
    expect(find.text('Enter your email address.'), findsOneWidget);
    expect(find.text('Enter your password.'), findsOneWidget);
  });

  testWidgets(
    'lesson: renders markdown, bookmarks, completes and lists its quiz',
    (tester) async {
      await pumpApp(tester);
      await signIn(tester);

      await tester.tap(find.text('Spotting phishing emails'));
      await tester.pumpAndSettle();
      expect(find.text('Why it matters'), findsOneWidget);
      expect(find.text('Check the sender'), findsOneWidget);
      expect(find.text('Stop and think.'), findsOneWidget);
      expect(find.text('Urgency'), findsOneWidget);

      await tester.tap(find.byIcon(Icons.bookmark_border));
      await tester.pumpAndSettle();
      expect(find.byIcon(Icons.bookmark), findsOneWidget);

      await tester.scrollUntilVisible(
        find.text('Mark as complete'),
        300,
        scrollable: find.byType(Scrollable).first,
      );
      await tester.tap(find.text('Mark as complete'));
      await tester.pumpAndSettle();
      expect(find.text('You’ve completed this lesson.'), findsOneWidget);

      await tester.scrollUntilVisible(
        find.text('Phishing basics'),
        300,
        scrollable: find.byType(Scrollable).first,
      );
      expect(find.text('Phishing basics'), findsOneWidget);
      expect(tester.takeException(), isNull);
    },
  );

  testWidgets('quiz: intro, answer, submit with a blank, review results', (
    tester,
  ) async {
    await pumpApp(tester);
    await signIn(tester);
    await goTab(tester, 'Learn');
    await tester.tap(find.text('Quizzes'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Phishing basics'));
    await tester.pumpAndSettle();
    expect(find.text('Start quiz'), findsOneWidget);
    expect(find.text('Unlimited'), findsNothing);

    await tester.tap(find.text('Start quiz'));
    await tester
        .pump(); // avoid pumpAndSettle: the countdown timer reschedules frames
    await tester.pump(const Duration(milliseconds: 500));
    expect(find.text('Question 1 of 2'), findsOneWidget);

    await tester.tap(find.text('The sender address'));
    await tester.pump();
    await tester.tap(find.text('Next'));
    await tester.pump();
    expect(find.text('Question 2 of 2'), findsOneWidget);

    // Leave the last question blank: the app must warn before submitting.
    await tester.tap(find.text('Submit'));
    await tester
        .pumpAndSettle(
          const Duration(milliseconds: 100),
          EnginePhase.sendSemanticsUpdate,
          const Duration(seconds: 2),
        )
        .catchError((_) => 0);
    expect(find.text('Submit with unanswered questions?'), findsOneWidget);
    await tester.tap(find.text('Submit').last);
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 500));

    expect(find.text('Results'), findsOneWidget);
    expect(find.text('50%'), findsOneWidget);
    expect(find.text('Not passed yet'), findsOneWidget);
    expect(find.text('By topic'), findsOneWidget);
    expect(find.text('Correct answer: No'), findsOneWidget);
    expect(find.text('Look-alike domain.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('phishing lab: inspect a link, flag, judge and read feedback', (
    tester,
  ) async {
    await pumpApp(tester);
    await signIn(tester);
    await goTab(tester, 'Learn');
    await tester.tap(find.text('Phishing lab'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Payroll update request'));
    await tester.pumpAndSettle();
    expect(find.text('Urgent: confirm your bank details'), findsOneWidget);

    await tester.tap(find.text('Tap to inspect where this link really goes'));
    await tester.pumpAndSettle();
    expect(find.text('Inspected — nothing was opened'), findsOneWidget);
    expect(find.textContaining('Connection is not encrypted'), findsOneWidget);
    expect(find.textContaining('spoofed name'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('Creates urgency'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Creates urgency'));
    await tester.pump();

    await tester.scrollUntilVisible(
      find.text('Suspicious'),
      300,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.text('Suspicious'));
    await tester.pump();
    await tester.tap(find.text('Submit answer'));
    await tester.pumpAndSettle();

    expect(find.text('Correct call'), findsOneWidget);
    expect(find.text('Score 85%'), findsOneWidget);
    expect(find.text('Always check the sender domain.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('incidents: list, detail timeline and the report form', (
    tester,
  ) async {
    await pumpApp(tester);
    await signIn(tester);
    await goTab(tester, 'Incidents');

    expect(find.text('My incidents'), findsOneWidget);
    expect(find.text('Suspicious attachment'), findsOneWidget);
    await tester.tap(find.text('Suspicious attachment'));
    await tester.pumpAndSettle();
    expect(find.text('INC-0021'), findsOneWidget);
    expect(find.text('Olive Officer'), findsOneWidget);
    expect(find.text('Incident submitted.'), findsOneWidget);
    await tester.pageBack();
    await tester.pumpAndSettle();

    await tester.tap(find.text('Report an incident'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Submit report'));
    await tester.pumpAndSettle();
    expect(find.text('Give the incident a short title.'), findsOneWidget);
    expect(find.text('Choose a category.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });

  testWidgets('alerts: unread badge, mark read; account: sign out', (
    tester,
  ) async {
    await pumpApp(tester);
    await signIn(tester);

    expect(find.text('1'), findsWidgets); // nav badge + dashboard stat
    await goTab(tester, 'Alerts');
    expect(find.text('Phishing wave targeting finance'), findsOneWidget);
    await tester.tap(find.text('Phishing wave targeting finance'));
    await tester.pumpAndSettle();
    expect(find.widgetWithText(TextButton, 'Mark all read'), findsOneWidget);

    await goTab(tester, 'Account');
    expect(find.text('Una User'), findsOneWidget);
    expect(find.text('Acme'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('Sign out'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(find.widgetWithText(FilledButton, 'Sign out'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(TextButton, 'Sign out'));
    await tester.pumpAndSettle();
    expect(
      find.text('Sign in to continue your security training.'),
      findsOneWidget,
    );
    expect(tester.takeException(), isNull);
  });
}
