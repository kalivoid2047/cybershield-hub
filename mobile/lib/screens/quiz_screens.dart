import 'dart:async';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/cybershield_api.dart';
import '../models/models.dart';
import '../theme.dart';
import '../widgets/common.dart';
import '../widgets/three_d.dart';
import 'lesson_detail_screen.dart';

// -- list ----------------------------------------------------------------------

class QuizzesTab extends StatefulWidget {
  const QuizzesTab({super.key});

  @override
  State<QuizzesTab> createState() => _QuizzesTabState();
}

class _QuizzesTabState extends State<QuizzesTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final api = context.read<CyberShieldApi>();
    return LoadView<List<QuizSummary>>(
      load: api.quizzes,
      builder: (context, quizzes, reload) {
        if (quizzes.isEmpty) {
          return ListView(
            children: const [
              SizedBox(height: 80),
              EmptyView(
                icon: Icons.quiz_outlined,
                title: 'No quizzes yet',
                message: 'Quizzes will appear here once they’re published.',
              ),
            ],
          );
        }
        return ListView.separated(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          itemCount: quizzes.length,
          separatorBuilder: (_, _) => const SizedBox(height: 10),
          itemBuilder: (context, index) {
            final quiz = quizzes[index];
            final best = quiz.bestScore;
            final passed = best != null && best >= quiz.passScore;
            return AppCard(
              onTap: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => QuizIntroScreen(quizId: quiz.id),
                  ),
                );
                await reload();
              },
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          quiz.title,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                      ),
                      if (best != null)
                        Pill(
                          passed
                              ? 'Passed ${best.round()}%'
                              : 'Best ${best.round()}%',
                          color: passed ? Palette.success : Palette.warning,
                        ),
                    ],
                  ),
                  if (quiz.description.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    MutedText(quiz.description, maxLines: 2),
                  ],
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 14,
                    runSpacing: 4,
                    children: [
                      _Meta(
                        Icons.help_outline,
                        '${quiz.questionCount} questions',
                      ),
                      _Meta(
                        Icons.timer_outlined,
                        '${quiz.timeLimitMinutes} min',
                      ),
                      _Meta(Icons.flag_outlined, 'Pass at ${quiz.passScore}%'),
                      if (quiz.attemptsRemaining != null)
                        _Meta(
                          Icons.repeat,
                          quiz.outOfAttempts
                              ? 'No attempts left'
                              : '${quiz.attemptsRemaining} attempts left',
                          color: quiz.outOfAttempts ? Palette.danger : null,
                        ),
                    ],
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }
}

class _Meta extends StatelessWidget {
  const _Meta(this.icon, this.label, {this.color});

  final IconData icon;
  final String label;
  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(icon, size: 14, color: color ?? Palette.textMuted),
        const SizedBox(width: 4),
        Text(
          label,
          style: TextStyle(fontSize: 12.5, color: color ?? Palette.textMuted),
        ),
      ],
    );
  }
}

// -- intro ---------------------------------------------------------------------

class QuizIntroScreen extends StatefulWidget {
  const QuizIntroScreen({super.key, required this.quizId});

  final int quizId;

  @override
  State<QuizIntroScreen> createState() => _QuizIntroScreenState();
}

class _QuizIntroScreenState extends State<QuizIntroScreen> {
  late Future<QuizDetail> _future;
  bool _starting = false;

  @override
  void initState() {
    super.initState();
    _future = context.read<CyberShieldApi>().quiz(widget.quizId);
  }

  Future<void> _start(QuizDetail quiz) async {
    setState(() => _starting = true);
    final navigator = Navigator.of(context);
    try {
      final attempt = await context.read<CyberShieldApi>().startQuiz(quiz.id);
      await navigator.push(
        MaterialPageRoute(
          builder: (_) => QuizTakeScreen(quiz: quiz, attempt: attempt),
        ),
      );
      // Refresh remaining-attempt counts after coming back from a quiz.
      if (mounted) {
        setState(() {
          _future = context.read<CyberShieldApi>().quiz(widget.quizId);
        });
      }
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _starting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Quiz')),
      body: FutureBuilder<QuizDetail>(
        future: _future,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return ErrorView(
              message: snapshot.error.toString(),
              onRetry: () => setState(() {
                _future = context.read<CyberShieldApi>().quiz(widget.quizId);
              }),
            );
          }
          final quiz = snapshot.data!;
          final blocked = quiz.attemptsRemaining == 0 || quiz.questions.isEmpty;
          return ListView(
            padding: const EdgeInsets.all(20),
            children: [
              Text(
                quiz.title,
                style: Theme.of(context).textTheme.headlineSmall
                    ?.copyWith(fontWeight: FontWeight.w800),
              ),
              if (quiz.description.isNotEmpty) ...[
                const SizedBox(height: 8),
                MutedText(quiz.description, size: 15),
              ],
              const SizedBox(height: 20),
              AppCard(
                child: Column(
                  children: [
                    _InfoRow(
                      Icons.help_outline,
                      'Questions',
                      '${quiz.questions.length}',
                    ),
                    const Divider(height: 24),
                    _InfoRow(
                      Icons.timer_outlined,
                      'Time limit',
                      '${quiz.timeLimitMinutes} minutes',
                    ),
                    const Divider(height: 24),
                    _InfoRow(
                      Icons.flag_outlined,
                      'Pass mark',
                      '${quiz.passScore}%',
                    ),
                    const Divider(height: 24),
                    _InfoRow(
                      Icons.repeat,
                      'Attempts left',
                      quiz.attemptsRemaining?.toString() ?? 'Unlimited',
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),
              const MutedText(
                'The timer starts as soon as you begin. If you leave and come back before time runs out, you’ll pick up the same attempt.',
              ),
              const SizedBox(height: 24),
              if (quiz.attemptsRemaining == 0)
                const ErrorBanner(
                  'You have used all of your attempts for this quiz.',
                )
              else if (quiz.questions.isEmpty)
                const ErrorBanner('This quiz has no questions yet.')
              else
                FilledButton.icon(
                  onPressed: (_starting || blocked) ? null : () => _start(quiz),
                  icon: _starting
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.play_arrow_rounded),
                  label: const Text('Start quiz'),
                ),
            ],
          );
        },
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  const _InfoRow(this.icon, this.label, this.value);

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Palette.accent),
        const SizedBox(width: 12),
        Expanded(child: Text(label)),
        Text(value, style: const TextStyle(fontWeight: FontWeight.w700)),
      ],
    );
  }
}

// -- taking a quiz -------------------------------------------------------------

class QuizTakeScreen extends StatefulWidget {
  const QuizTakeScreen({super.key, required this.quiz, required this.attempt});

  final QuizDetail quiz;
  final QuizAttempt attempt;

  @override
  State<QuizTakeScreen> createState() => _QuizTakeScreenState();
}

class _QuizTakeScreenState extends State<QuizTakeScreen> {
  final Map<int, int> _answers = {};
  late final DateTime _deadline;
  Timer? _timer;
  Duration _remaining = Duration.zero;
  int _index = 0;
  bool _submitting = false;
  bool _finished = false;

  List<QuizQuestion> get _questions => widget.quiz.questions;

  @override
  void initState() {
    super.initState();
    // A resumed attempt keeps its original start time, so the clock can't be reset by leaving.
    final started = widget.attempt.startedAt ?? DateTime.now();
    _deadline = started.add(Duration(minutes: widget.quiz.timeLimitMinutes));
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _tick() {
    final left = _deadline.difference(DateTime.now());
    if (left <= Duration.zero) {
      _timer?.cancel();
      setState(() => _remaining = Duration.zero);
      _submit(timedOut: true);
    } else {
      setState(() => _remaining = left);
    }
  }

  Future<void> _submit({bool timedOut = false}) async {
    if (_submitting || _finished) return;
    if (timedOut && _answers.isEmpty) {
      _finished = true;
      showSnack(context, 'Time’s up — no answers were recorded.', error: true);
      Navigator.of(context).pop();
      return;
    }
    setState(() => _submitting = true);
    final navigator = Navigator.of(context);
    try {
      final result = await context.read<CyberShieldApi>().submitQuiz(
        widget.quiz.id,
        widget.attempt.id,
        _answers,
      );
      _finished = true;
      _timer?.cancel();
      navigator.pushReplacement(
        MaterialPageRoute(
          builder: (_) => QuizResultScreen(attempt: result, timedOut: timedOut),
        ),
      );
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  Future<bool> _confirmSubmit() async {
    final unanswered = _questions.length - _answers.length;
    if (unanswered == 0) return true;
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Submit with unanswered questions?'),
        content: Text(
          '$unanswered ${unanswered == 1 ? 'question is' : 'questions are'} still blank and will count as incorrect.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Keep going'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Submit'),
          ),
        ],
      ),
    );
    return ok ?? false;
  }

  Future<void> _confirmLeave() async {
    final leave = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Leave this quiz?'),
        content: const Text(
          'Your answers won’t be saved, but the timer keeps running. You can resume the attempt until time runs out.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Stay'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Leave'),
          ),
        ],
      ),
    );
    if (leave == true && mounted) {
      _finished = true;
      Navigator.of(context).pop();
    }
  }

  String get _clock {
    final m = _remaining.inMinutes.remainder(100).toString().padLeft(2, '0');
    final s = _remaining.inSeconds.remainder(60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final question = _questions[_index];
    final selected = _answers[question.id];
    final isLast = _index == _questions.length - 1;
    final lowTime = _remaining.inSeconds <= 60;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && !_submitting) _confirmLeave();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(
            'Question ${_index + 1} of ${_questions.length}',
            style: const TextStyle(fontSize: 16),
          ),
          leading: IconButton(
            icon: const Icon(Icons.close),
            onPressed: _submitting ? null : _confirmLeave,
          ),
          actions: [
            Padding(
              padding: const EdgeInsets.only(right: 16),
              child: Center(
                child: Pill(
                  _clock,
                  color: lowTime ? Palette.danger : Palette.accent,
                  icon: Icons.timer_outlined,
                ),
              ),
            ),
          ],
          bottom: PreferredSize(
            preferredSize: const Size.fromHeight(4),
            child: ProgressBar(
              (_index + 1) / _questions.length * 100,
              height: 4,
            ),
          ),
        ),
        body: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  if (question.competency.isNotEmpty) ...[
                    Pill(question.competency, color: Palette.textMuted),
                    const SizedBox(height: 12),
                  ],
                  Text(
                    question.prompt,
                    style: Theme.of(context).textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.w700, height: 1.35),
                  ),
                  const SizedBox(height: 20),
                  for (final answer in question.answers)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: _AnswerTile(
                        text: answer.text,
                        selected: selected == answer.id,
                        onTap: _submitting
                            ? null
                            : () => setState(
                                () => _answers[question.id] = answer.id,
                              ),
                      ),
                    ),
                ],
              ),
            ),
            SafeArea(
              top: false,
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 12),
                child: Row(
                  children: [
                    if (_index > 0) ...[
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _submitting
                              ? null
                              : () => setState(() => _index--),
                          child: const Text('Back'),
                        ),
                      ),
                      const SizedBox(width: 12),
                    ],
                    Expanded(
                      flex: 2,
                      child: FilledButton(
                        onPressed: _submitting
                            ? null
                            : isLast
                            ? () async {
                                if (await _confirmSubmit()) _submit();
                              }
                            : () => setState(() => _index++),
                        child: _submitting
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                ),
                              )
                            : Text(isLast ? 'Submit' : 'Next'),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _AnswerTile extends StatelessWidget {
  const _AnswerTile({
    required this.text,
    required this.selected,
    required this.onTap,
  });

  final String text;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? Palette.accent.withValues(alpha: 0.12)
          : Palette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: selected ? Palette.accent : Palette.border,
          width: selected ? 1.6 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Icon(
                selected ? Icons.radio_button_checked : Icons.radio_button_off,
                color: selected ? Palette.accent : Palette.textMuted,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  text,
                  style: const TextStyle(fontSize: 15, height: 1.35),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// -- results -------------------------------------------------------------------

class QuizResultScreen extends StatelessWidget {
  const QuizResultScreen({
    super.key,
    required this.attempt,
    this.timedOut = false,
  });

  final QuizAttempt attempt;
  final bool timedOut;

  @override
  Widget build(BuildContext context) {
    final passed = attempt.passed;
    final color = passed ? Palette.success : Palette.warning;
    final canRetry = attempt.attemptsRemaining != 0;
    final lessonSlug = attempt.lessonSlug;
    final weak = [...attempt.weakness]
      ..sort((a, b) => a.score.compareTo(b.score));

    return Scaffold(
      appBar: AppBar(title: const Text('Results')),
      body: ListView(
        padding: const EdgeInsets.all(20),
        children: [
          AppCard(
            accent: color,
            child: Column(
              children: [
                Layered3DIcon(
                  icon: passed
                      ? Icons.emoji_events_rounded
                      : Icons.shield_rounded,
                  overlayIcon: passed ? null : Icons.replay_rounded,
                  size: 84,
                  color: color,
                ),
                Text(
                  '${attempt.score.round()}%',
                  style: const TextStyle(
                    fontSize: 44,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                Text(
                  passed ? 'Passed' : 'Not passed yet',
                  style: TextStyle(
                    color: color,
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 6),
                MutedText(
                  '${attempt.earnedPoints} / ${attempt.totalPoints} points · pass mark ${attempt.passScore}%',
                  align: TextAlign.center,
                ),
                if (timedOut) ...[
                  const SizedBox(height: 8),
                  const MutedText(
                    'Time ran out, so your answers were submitted automatically.',
                    align: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
          if (weak.isNotEmpty) ...[
            const SectionTitle('By topic'),
            AppCard(
              child: Column(
                children: [
                  for (final entry in weak)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 6),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: Text(
                                  entry.competency,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              MutedText('${entry.correct}/${entry.total}'),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ProgressBar(
                            entry.score,
                            color: entry.score >= attempt.passScore
                                ? Palette.success
                                : Palette.warning,
                          ),
                        ],
                      ),
                    ),
                ],
              ),
            ),
          ],
          const SectionTitle('Review your answers'),
          for (var i = 0; i < attempt.answers.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _ReviewCard(number: i + 1, answer: attempt.answers[i]),
            ),
          const SizedBox(height: 8),
          if (!passed && lessonSlug != null) ...[
            OutlinedButton.icon(
              onPressed: () => Navigator.of(context).push(
                MaterialPageRoute(
                  builder: (_) => LessonDetailScreen(slug: lessonSlug),
                ),
              ),
              icon: const Icon(Icons.menu_book_outlined),
              label: Text('Review “${attempt.lessonTitle ?? 'the lesson'}”'),
            ),
            const SizedBox(height: 10),
          ],
          FilledButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(canRetry && !passed ? 'Back to quiz' : 'Done'),
          ),
        ],
      ),
    );
  }
}

class _ReviewCard extends StatelessWidget {
  const _ReviewCard({required this.number, required this.answer});

  final int number;
  final AttemptAnswer answer;

  @override
  Widget build(BuildContext context) {
    final color = answer.isCorrect ? Palette.success : Palette.danger;
    return AppCard(
      accent: color,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(
                answer.isCorrect ? Icons.check_circle : Icons.cancel,
                color: color,
                size: 20,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  '$number. ${answer.questionPrompt}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    height: 1.35,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          if (!answer.isCorrect)
            MutedText('Your answer: ${answer.selectedText ?? 'No answer'}'),
          if (answer.correctText != null) ...[
            const SizedBox(height: 4),
            Text(
              'Correct answer: ${answer.correctText}',
              style: const TextStyle(
                color: Palette.success,
                fontSize: 13.5,
                height: 1.35,
              ),
            ),
          ],
          if (answer.explanation.isNotEmpty) ...[
            const SizedBox(height: 8),
            MutedText(answer.explanation),
          ],
        ],
      ),
    );
  }
}
