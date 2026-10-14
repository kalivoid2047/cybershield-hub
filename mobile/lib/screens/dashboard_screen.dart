import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/cybershield_api.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/common.dart';
import '../widgets/glass.dart';
import '../widgets/three_d.dart';
import 'learn_screen.dart';
import 'lesson_detail_screen.dart';

class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key, required this.onOpenTab});

  /// Switches the bottom-navigation tab (1 = Learn, 2 = Incidents, 3 = Account).
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
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${_greeting()},',
                        style: Theme.of(context).textTheme.bodyMedium
                            ?.copyWith(color: Palette.textMuted),
                      ),
                      GradientText(
                        user.firstName.isEmpty ? user.fullName : user.firstName,
                        align: TextAlign.start,
                        style: Theme.of(context).textTheme.headlineMedium
                            ?.copyWith(fontWeight: FontWeight.w800),
                      ),
                    ],
                  ),
                ),
                GestureDetector(
                  onTap: () => onOpenTab(3),
                  child: Container(
                    width: 48,
                    height: 48,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      gradient: const LinearGradient(
                        colors: [Palette.accent, Color(0xFF7C3AED)],
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Palette.accent.withValues(alpha: 0.4),
                          blurRadius: 14,
                        ),
                      ],
                    ),
                    child: Text(
                      user.initials,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                ),
              ],
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
    return Tilt3D(
      child: AppCard(
        child: Row(
          children: [
            _ScoreRing(score: score, color: color),
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
      ),
    );
  }
}

class _ScoreRing extends StatelessWidget {
  const _ScoreRing({required this.score, required this.color});

  final int score;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<double>(
      tween: Tween(end: score.toDouble()),
      duration: reduceMotion(context)
          ? Duration.zero
          : const Duration(milliseconds: 1300),
      curve: Curves.easeOutCubic,
      builder: (context, value, _) => SizedBox(
        width: 100,
        height: 100,
        child: CustomPaint(
          painter: _RingPainter(progress: value / 100, color: color),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  '${value.round()}',
                  style: const TextStyle(
                    fontSize: 30,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const MutedText('of 100', size: 11),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _RingPainter extends CustomPainter {
  _RingPainter({required this.progress, required this.color});

  final double progress;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    const stroke = 10.0;
    final rect = Offset.zero & size;
    final arc = rect.deflate(stroke / 2 + 2);
    final track = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = stroke
      ..color = Colors.white.withValues(alpha: 0.09);
    canvas.drawArc(arc, 0, math.pi * 2, false, track);
    if (progress <= 0) return;

    final sweep = math.pi * 2 * progress;
    final shader = SweepGradient(
      startAngle: -math.pi / 2,
      endAngle: -math.pi / 2 + math.pi * 2,
      colors: [
        color.withValues(alpha: 0.5),
        Color.lerp(color, Colors.white, 0.4)!,
      ],
      transform: const GradientRotation(0),
    ).createShader(rect);
    // Soft glow under the arc, then the crisp gradient stroke on top.
    canvas.drawArc(
      arc,
      -math.pi / 2,
      sweep,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..color = color.withValues(alpha: 0.55)
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8),
    );
    canvas.drawArc(
      arc,
      -math.pi / 2,
      sweep,
      false,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = stroke
        ..strokeCap = StrokeCap.round
        ..shader = shader,
    );
  }

  @override
  bool shouldRepaint(_RingPainter old) =>
      old.progress != progress || old.color != color;
}

String _greeting() {
  final hour = DateTime.now().hour;
  if (hour < 5) return 'Working late';
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
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
    return Tilt3D(
      child: AppCard(
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
      ),
    );
  }
}
