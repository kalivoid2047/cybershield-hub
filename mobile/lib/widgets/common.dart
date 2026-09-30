import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../theme.dart';
import 'glass.dart';

// -- formatting helpers --------------------------------------------------------

Color colorFromHex(String hex, [Color fallback = Palette.accent]) {
  final cleaned = hex.replaceAll('#', '');
  if (cleaned.length != 6) return fallback;
  final value = int.tryParse(cleaned, radix: 16);
  return value == null ? fallback : Color(0xFF000000 | value);
}

Color severityColor(String severity) {
  switch (severity) {
    case 'critical':
      return Palette.danger;
    case 'high':
      return Palette.orange;
    case 'medium':
      return Palette.warning;
    case 'low':
      return Palette.success;
    default:
      return Palette.accent; // info
  }
}

Color statusColor(String status) {
  switch (status) {
    case 'open':
      return Palette.accent;
    case 'investigating':
      return Palette.warning;
    case 'escalated':
      return Palette.danger;
    case 'resolved':
      return Palette.success;
    default:
      return Palette.textMuted;
  }
}

String titleCase(String text) => text.isEmpty
    ? text
    : text
          .split(RegExp(r'[_\s]+'))
          .map((w) => w.isEmpty ? w : '${w[0].toUpperCase()}${w.substring(1)}')
          .join(' ');

String formatDate(DateTime? date) =>
    date == null ? '' : DateFormat.yMMMd().format(date);

String formatDateTime(DateTime? date) =>
    date == null ? '' : DateFormat.yMMMd().add_jm().format(date);

String timeAgo(DateTime? date) {
  if (date == null) return '';
  final diff = DateTime.now().difference(date);
  if (diff.inMinutes < 1) return 'just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  return formatDate(date);
}

void showSnack(BuildContext context, String message, {bool error = false}) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: error ? const Color(0xFF7F1D1D) : Palette.surfaceHigh,
      ),
    );
}

// -- small building blocks -----------------------------------------------------

class Pill extends StatelessWidget {
  const Pill(this.label, {super.key, this.color = Palette.accent, this.icon});

  final String label;
  final Color color;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 3),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.14),
        borderRadius: BorderRadius.circular(99),
        border: Border.all(color: color.withValues(alpha: 0.35)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              color: color,
              fontSize: 11.5,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}

class ProgressBar extends StatelessWidget {
  const ProgressBar(
    this.percent, {
    super.key,
    this.color = Palette.accent,
    this.height = 6,
  });

  final num percent;
  final Color color;
  final double height;

  @override
  Widget build(BuildContext context) {
    final target = (percent / 100).clamp(0, 1).toDouble();
    return TweenAnimationBuilder<double>(
      tween: Tween(end: target),
      duration: reduceMotion(context)
          ? Duration.zero
          : const Duration(milliseconds: 700),
      curve: Curves.easeOutCubic,
      builder: (context, value, _) => Container(
        height: height,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.09),
          borderRadius: BorderRadius.circular(99),
        ),
        alignment: Alignment.centerLeft,
        child: FractionallySizedBox(
          widthFactor: value,
          child: DecoratedBox(
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(99),
              gradient: LinearGradient(
                colors: [
                  color.withValues(alpha: 0.75),
                  Color.lerp(color, Colors.white, 0.35)!,
                ],
              ),
              boxShadow: value > 0
                  ? [
                      BoxShadow(
                        color: color.withValues(alpha: 0.55),
                        blurRadius: 8,
                      ),
                    ]
                  : null,
            ),
          ),
        ),
      ),
    );
  }
}

class SectionTitle extends StatelessWidget {
  const SectionTitle(this.text, {super.key, this.trailing});

  final String text;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(top: 8, bottom: 10),
      child: Row(
        children: [
          Expanded(
            child: Text(
              text,
              style: Theme.of(context).textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w700),
            ),
          ),
          ?trailing,
        ],
      ),
    );
  }
}

class MutedText extends StatelessWidget {
  const MutedText(
    this.text, {
    super.key,
    this.size = 13,
    this.maxLines,
    this.align,
  });

  final String text;
  final double size;
  final int? maxLines;
  final TextAlign? align;

  @override
  Widget build(BuildContext context) => Text(
    text,
    maxLines: maxLines,
    textAlign: align,
    overflow: maxLines == null ? null : TextOverflow.ellipsis,
    style: TextStyle(color: Palette.textMuted, fontSize: size, height: 1.35),
  );
}

class EmptyView extends StatelessWidget {
  const EmptyView({
    super.key,
    required this.icon,
    required this.title,
    this.message,
  });

  final IconData icon;
  final String title;
  final String? message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 44, color: Palette.textMuted),
            const SizedBox(height: 12),
            Text(
              title,
              style: Theme.of(context).textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            if (message != null) ...[
              const SizedBox(height: 6),
              MutedText(message!, align: TextAlign.center),
            ],
          ],
        ),
      ),
    );
  }
}

class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.message, required this.onRetry});

  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(
              Icons.cloud_off_rounded,
              size: 44,
              color: Palette.danger,
            ),
            const SizedBox(height: 12),
            Text(message, textAlign: TextAlign.center),
            const SizedBox(height: 16),
            SizedBox(
              width: 160,
              child: OutlinedButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh),
                label: const Text('Try again'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Inline banner for form-level errors.
class ErrorBanner extends StatelessWidget {
  const ErrorBanner(this.message, {super.key});

  final String message;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Palette.danger.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Palette.danger.withValues(alpha: 0.4)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.error_outline, size: 18, color: Palette.danger),
          const SizedBox(width: 8),
          Expanded(
            child: Text(message, style: const TextStyle(fontSize: 13.5)),
          ),
        ],
      ),
    );
  }
}

class AppCard extends StatelessWidget {
  const AppCard({
    super.key,
    required this.child,
    this.onTap,
    this.padding = const EdgeInsets.all(16),
    this.accent,
    this.animate = true,
  });

  final Widget child;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry padding;
  final Color? accent;

  /// Cards cascade in when a screen loads; turn off for cards nested in other cards.
  final bool animate;

  @override
  Widget build(BuildContext context) {
    final card = GlassCard(
      onTap: onTap,
      padding: padding,
      tint: accent,
      child: child,
    );
    return animate ? FadeSlideIn(child: card) : card;
  }
}

// -- async loading -------------------------------------------------------------

/// Runs [load] once, shows a spinner / error-with-retry / the built content, and
/// supports pull-to-refresh. The [builder] should return a scrollable.
class LoadView<T> extends StatefulWidget {
  const LoadView({super.key, required this.load, required this.builder});

  final Future<T> Function() load;
  final Widget Function(
    BuildContext context,
    T data,
    Future<void> Function() reload,
  )
  builder;

  @override
  State<LoadView<T>> createState() => _LoadViewState<T>();
}

class _LoadViewState<T> extends State<LoadView<T>> {
  T? _data;
  String? _error;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _fetch();
  }

  Future<void> _fetch({bool silent = false}) async {
    if (!silent) setState(() => _loading = true);
    try {
      final data = await widget.load();
      if (!mounted) return;
      setState(() {
        _data = data;
        _error = null;
        _loading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        // On a background refresh keep showing the old data rather than blanking the screen.
        if (!silent || _data == null) _error = error.toString();
        _loading = false;
      });
      if (silent && _data != null) {
        showSnack(context, error.toString(), error: true);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading && _data == null) {
      return const SkeletonList();
    }
    if (_error != null && _data == null) {
      return ErrorView(message: _error!, onRetry: _fetch);
    }
    return RefreshIndicator(
      onRefresh: () => _fetch(silent: true),
      child: widget.builder(context, _data as T, () => _fetch(silent: true)),
    );
  }
}
