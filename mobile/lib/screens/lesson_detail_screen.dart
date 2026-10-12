import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/cybershield_api.dart';
import '../models/models.dart';
import '../theme.dart';
import '../widgets/common.dart';
import '../widgets/markdown_content.dart';
import 'quiz_screens.dart';

class LessonDetailScreen extends StatefulWidget {
  const LessonDetailScreen({super.key, required this.slug});

  final String slug;

  @override
  State<LessonDetailScreen> createState() => _LessonDetailScreenState();
}

class _LessonDetailScreenState extends State<LessonDetailScreen> {
  final _scroll = ScrollController();
  Lesson? _lesson;
  String? _error;
  bool _busy = false;

  // Furthest scroll position reported to the server so far, to avoid a request per frame.
  int _reported = 0;

  @override
  void initState() {
    super.initState();
    _scroll.addListener(_onScroll);
    _load();
  }

  @override
  void dispose() {
    _scroll.dispose();
    super.dispose();
  }

  CyberShieldApi get _api => context.read<CyberShieldApi>();

  Future<void> _load() async {
    setState(() => _error = null);
    try {
      final lesson = await _api.lesson(widget.slug);
      if (!mounted) return;
      setState(() {
        _lesson = lesson;
        _reported = lesson.progressPercent;
      });
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    }
  }

  /// Reading progress follows how far the learner has scrolled, in 25% steps.
  /// Completion is always an explicit tap, so scrolling never marks a lesson done.
  void _onScroll() {
    final lesson = _lesson;
    if (lesson == null || lesson.isComplete || !_scroll.hasClients) return;
    final max = _scroll.position.maxScrollExtent;
    if (max <= 0) return;
    final step = ((_scroll.offset / max) * 4).floor().clamp(0, 3) * 25;
    if (step > _reported) {
      _reported = step;
      _api
          .setLessonProgress(lesson.slug, step)
          .then((_) {
            if (mounted) {
              setState(
                () => _lesson = _lesson?.copyWith(progressPercent: step),
              );
            }
          })
          .catchError((_) {
            _reported = step - 25; // let the next scroll retry
          });
    }
  }

  Future<void> _toggleBookmark() async {
    final lesson = _lesson!;
    final next = !lesson.isBookmarked;
    setState(() => _lesson = lesson.copyWith(isBookmarked: next));
    try {
      await _api.setBookmark(lesson.slug, next);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _lesson = lesson);
      showSnack(context, e.message, error: true);
    }
  }

  Future<void> _complete() async {
    final lesson = _lesson!;
    setState(() => _busy = true);
    try {
      await _api.completeLesson(lesson.slug);
      if (!mounted) return;
      setState(() => _lesson = lesson.copyWith(progressPercent: 100));
      showSnack(context, 'Lesson completed. Nice work!');
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final lesson = _lesson;
    return Scaffold(
      appBar: AppBar(
        actions: [
          if (lesson != null)
            IconButton(
              tooltip: lesson.isBookmarked ? 'Remove bookmark' : 'Bookmark',
              icon: Icon(
                lesson.isBookmarked ? Icons.bookmark : Icons.bookmark_border,
                color: lesson.isBookmarked ? Palette.warning : null,
              ),
              onPressed: _toggleBookmark,
            ),
        ],
      ),
      body: lesson == null
          ? (_error != null
                ? ErrorView(message: _error!, onRetry: _load)
                : const Center(child: CircularProgressIndicator()))
          : ListView(
              controller: _scroll,
              padding: const EdgeInsets.fromLTRB(20, 4, 20, 32),
              children: [
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  children: [
                    Pill(
                      lesson.categoryName,
                      color: colorFromHex(lesson.categoryColor),
                    ),
                    Pill(
                      titleCase(lesson.difficulty),
                      color: Palette.textMuted,
                    ),
                    Pill(
                      '${lesson.estimatedMinutes} min',
                      color: Palette.textMuted,
                      icon: Icons.schedule,
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Text(
                  lesson.title,
                  style: Theme.of(context).textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w800, height: 1.2),
                ),
                const SizedBox(height: 8),
                MutedText(lesson.summary, size: 15),
                const SizedBox(height: 14),
                ProgressBar(
                  lesson.progressPercent,
                  color: lesson.isComplete ? Palette.success : Palette.accent,
                ),
                const SizedBox(height: 22),
                MarkdownContent(lesson.content),
                const SizedBox(height: 12),
                if (lesson.isComplete)
                  const AppCard(
                    accent: Palette.success,
                    child: Row(
                      children: [
                        Icon(Icons.check_circle, color: Palette.success),
                        SizedBox(width: 10),
                        Expanded(child: Text('You’ve completed this lesson.')),
                      ],
                    ),
                  )
                else
                  FilledButton.icon(
                    onPressed: _busy || lesson.quizRequired ? null : _complete,
                    icon: const Icon(Icons.check),
                    label: Text(
                      lesson.quizRequired
                          ? 'Take the quiz to complete'
                          : 'Mark as complete',
                    ),
                  ),
                if (lesson.quizzes.isNotEmpty) ...[
                  const SizedBox(height: 24),
                  const SectionTitle('Test your knowledge'),
                  for (final quiz in lesson.quizzes)
                    Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: AppCard(
                        onTap: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) => QuizIntroScreen(quizId: quiz.id),
                            ),
                          );
                          // The attempt may have unlocked completion.
                          if (mounted) _load();
                        },
                        child: Row(
                          children: [
                            const Icon(
                              Icons.quiz_outlined,
                              color: Palette.accent,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                quiz.title,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                            const Icon(
                              Icons.chevron_right,
                              color: Palette.textMuted,
                            ),
                          ],
                        ),
                      ),
                    ),
                ],
              ],
            ),
    );
  }
}
