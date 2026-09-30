import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/cybershield_api.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import 'learn_screen.dart';
import 'lesson_detail_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key, required this.onOpenTab});

  /// Switches the bottom-navigation tab (1 = Learn, 2 = Incidents, 3 = Alerts).
  final ValueChanged<int> onOpenTab;

  @override
  Widget build(BuildContext context) {
    final api = context.read<CyberShieldApi>();
    final user = context.watch<AuthState>().user!;

    return LoadView<(DashboardStats, List<Lesson>)>(
      load: () async {
        final results = await Future.wait([
          api.dashboard(),
          api.recommendedLessons(),
        ]);
        return (results[0] as DashboardStats, results[1] as List<Lesson>);
      },
      builder: (context, data, reload) {
        final (stats, recommended) = data;
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
          children: [
            Text(
              'Welcome back,',
              style: Theme.of(context).textTheme.bodyMedium
                  ?.copyWith(color: Palette.textMuted),
            ),
            Text(
              user.firstName.isEmpty ? user.fullName : user.firstName,
              style: Theme.of(context).textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 16),
            _ScoreCard(stats: stats),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _StatTile(
                    icon: Icons.quiz_outlined,
                    label: 'Quiz average',
                    value: '${stats.quizAverage.round()}%',
                    color: Palette.accent,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatTile(
                    icon: Icons.phishing_outlined,
                    label: 'Phishing lab',
                    value: '${stats.phishingAverage.round()}%',
                    color: Palette.orange,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _StatTile(
                    icon: Icons.report_outlined,
                    label: 'Open incidents',
                    value: '${stats.openIncidents}',
                    color: stats.openIncidents > 0
                        ? Palette.warning
                        : Palette.success,
                    onTap: () => onOpenTab(2),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatTile(
                    icon: Icons.notifications_outlined,
                    label: 'Unread alerts',
                    value: '${stats.unreadNotifications}',
                    color: stats.unreadNotifications > 0
                        ? Palette.danger
                        : Palette.success,
                    onTap: () => onOpenTab(3),
                  ),
                ),
              ],
            ),
            SectionTitle(
              'Recommended for you',
              trailing: TextButton(
                onPressed: () => onOpenTab(1),
                child: const Text('See all'),
              ),
            ),
            if (recommended.isEmpty)
              const AppCard(
                child: MutedText(
                  'You’re all caught up — no lessons waiting. Check the Learn tab for quizzes and phishing drills.',
                ),
              )
            else
              for (final lesson in recommended.take(4))
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
                      await reload();
                    },
                  ),
                ),
          ],
        );
      },
    );
  }
}

class _ScoreCard extends StatelessWidget {
  const _ScoreCard({required this.stats});

  final DashboardStats stats;

  @override
  Widget build(BuildContext context) {
    final score = stats.securityScore;
    final color = score >= 75
        ? Palette.success
        : score >= 50
        ? Palette.warning
        : Palette.danger;
    final lessonPercent = stats.lessonsTotal == 0
        ? 0
        : (stats.lessonsCompleted / stats.lessonsTotal * 100);
    return AppCard(
      child: Row(
        children: [
          SizedBox(
            width: 96,
            height: 96,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox.expand(
                  child: CircularProgressIndicator(
                    value: score / 100,
                    strokeWidth: 9,
                    color: color,
                    backgroundColor: Palette.border,
                    strokeCap: StrokeCap.round,
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      '$score',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const MutedText('of 100', size: 11),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 18),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Security score',
                  style: Theme.of(context).textTheme.titleMedium
                      ?.copyWith(fontWeight: FontWeight.w700),
                ),
                const SizedBox(height: 4),
                MutedText(
                  '${stats.lessonsCompleted} of ${stats.lessonsTotal} lessons completed',
                ),
                const SizedBox(height: 10),
                ProgressBar(lessonPercent, color: color),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StatTile extends StatelessWidget {
  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
    this.onTap,
  });

  final IconData icon;
  final String label;
  final String value;
  final Color color;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      onTap: onTap,
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 10),
          Text(
            value,
            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800),
          ),
          MutedText(label, size: 12.5),
        ],
      ),
    );
  }
}
