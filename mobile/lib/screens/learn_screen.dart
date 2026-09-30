import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/cybershield_api.dart';
import '../models/models.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'lesson_detail_screen.dart';
import 'phishing_screens.dart';
import 'quiz_screens.dart';

/// "Learn" tab: lessons, quizzes and phishing drills under one roof.
class LearnScreen extends StatelessWidget {
  const LearnScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const DefaultTabController(
      length: 3,
      child: Column(
        children: [
          TabBar(
            tabs: [
              Tab(text: 'Lessons'),
              Tab(text: 'Quizzes'),
              Tab(text: 'Phishing lab'),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [_LessonsTab(), QuizzesTab(), PhishingTab()],
            ),
          ),
        ],
      ),
    );
  }
}

class LessonCard extends StatelessWidget {
  const LessonCard({super.key, required this.lesson, required this.onTap});

  final Lesson lesson;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = colorFromHex(lesson.categoryColor);
    return AppCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Pill(lesson.categoryName, color: color),
              const SizedBox(width: 6),
              Pill(titleCase(lesson.difficulty), color: Palette.textMuted),
              const Spacer(),
              if (lesson.isBookmarked)
                const Icon(Icons.bookmark, size: 18, color: Palette.warning),
              if (lesson.isComplete)
                const Padding(
                  padding: EdgeInsets.only(left: 6),
                  child: Icon(
                    Icons.check_circle,
                    size: 18,
                    color: Palette.success,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            lesson.title,
            style: Theme.of(context).textTheme.titleMedium
                ?.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 4),
          MutedText(lesson.summary, maxLines: 2),
          const SizedBox(height: 12),
          Row(
            children: [
              const Icon(Icons.schedule, size: 14, color: Palette.textMuted),
              const SizedBox(width: 4),
              MutedText('${lesson.estimatedMinutes} min', size: 12),
              const SizedBox(width: 14),
              Expanded(
                child: ProgressBar(
                  lesson.progressPercent,
                  color: lesson.isComplete ? Palette.success : color,
                ),
              ),
              const SizedBox(width: 8),
              MutedText('${lesson.progressPercent}%', size: 12),
            ],
          ),
        ],
      ),
    );
  }
}

class _LessonsTab extends StatefulWidget {
  const _LessonsTab();

  @override
  State<_LessonsTab> createState() => _LessonsTabState();
}

class _LessonsTabState extends State<_LessonsTab>
    with AutomaticKeepAliveClientMixin {
  String _query = '';
  String? _category;

  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final api = context.read<CyberShieldApi>();
    return LoadView<List<Lesson>>(
      load: api.lessons,
      builder: (context, lessons, reload) {
        final categories = {for (final l in lessons) l.categoryName}.toList()
          ..sort();
        final needle = _query.trim().toLowerCase();
        final visible = lessons.where((l) {
          if (_category != null && l.categoryName != _category) return false;
          return needle.isEmpty ||
              l.title.toLowerCase().contains(needle) ||
              l.summary.toLowerCase().contains(needle) ||
              l.tags.any((t) => t.toLowerCase().contains(needle));
        }).toList();

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            TextField(
              decoration: const InputDecoration(
                hintText: 'Search lessons',
                prefixIcon: Icon(Icons.search),
                isDense: true,
              ),
              onChanged: (value) => setState(() => _query = value),
            ),
            const SizedBox(height: 10),
            SizedBox(
              height: 38,
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: const Text('All'),
                      selected: _category == null,
                      onSelected: (_) => setState(() => _category = null),
                    ),
                  ),
                  for (final name in categories)
                    Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(name),
                        selected: _category == name,
                        onSelected: (_) => setState(
                          () => _category = _category == name ? null : name,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            if (visible.isEmpty)
              const Padding(
                padding: EdgeInsets.only(top: 40),
                child: EmptyView(
                  icon: Icons.menu_book_outlined,
                  title: 'No lessons found',
                  message: 'Try a different search or category.',
                ),
              )
            else
              for (final lesson in visible)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: LessonCard(
                    lesson: lesson,
                    onTap: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) => LessonDetailScreen(slug: lesson.slug),
                        ),
                      );
                      await reload(); // progress/bookmark may have changed
                    },
                  ),
                ),
          ],
        );
      },
    );
  }
}
