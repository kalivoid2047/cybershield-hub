import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../models/models.dart';
import '../state/alerts_state.dart';
import '../theme.dart';
import '../widgets/common.dart';

IconData _typeIcon(String type) {
  switch (type) {
    case 'threat_advisory':
      return Icons.gpp_maybe_outlined;
    case 'daily_tip':
      return Icons.lightbulb_outline;
    default:
      return Icons.campaign_outlined;
  }
}

String _typeLabel(String type) => type.isEmpty ? 'Alert' : titleCase(type);

class AlertsScreen extends StatelessWidget {
  const AlertsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final alerts = context.watch<AlertsState>();

    Widget body;
    if (alerts.loading && alerts.items.isEmpty) {
      body = const Center(child: CircularProgressIndicator());
    } else if (alerts.error != null && alerts.items.isEmpty) {
      body = ErrorView(message: alerts.error!, onRetry: alerts.load);
    } else if (alerts.items.isEmpty) {
      body = ListView(
        children: const [
          SizedBox(height: 120),
          EmptyView(
            icon: Icons.notifications_none,
            title: 'Nothing new',
            message: 'Security advisories and tips from your team will show up here.',
          ),
        ],
      );
    } else {
      body = ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.fromLTRB(16, 4, 16, 24),
        itemCount: alerts.items.length,
        separatorBuilder: (_, _) => const SizedBox(height: 10),
        itemBuilder: (context, index) =>
            _AlertCard(notification: alerts.items[index]),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 8, 8),
          child: Row(
            children: [
              Expanded(
                child: Text(
                  'Alerts',
                  style: Theme.of(context).textTheme.headlineSmall
                      ?.copyWith(fontWeight: FontWeight.w800),
                ),
              ),
              TextButton.icon(
                onPressed: alerts.unread == 0
                    ? null
                    : () async {
                        try {
                          await alerts.markAllRead();
                        } on ApiException catch (e) {
                          if (context.mounted) {
                            showSnack(context, e.message, error: true);
                          }
                        }
                      },
                icon: const Icon(Icons.done_all, size: 18),
                label: const Text('Mark all read'),
              ),
            ],
          ),
        ),
        Expanded(
          child: RefreshIndicator(onRefresh: alerts.load, child: body),
        ),
      ],
    );
  }
}

class _AlertCard extends StatelessWidget {
  const _AlertCard({required this.notification});

  final AppNotification notification;

  @override
  Widget build(BuildContext context) {
    final color = severityColor(notification.priority);
    final unread = !notification.isRead;
    return AppCard(
      accent: unread ? color : null,
      onTap: () => context.read<AlertsState>().markRead(notification),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.14),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              _typeIcon(notification.alertType),
              color: color,
              size: 20,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        notification.title,
                        style: TextStyle(
                          fontWeight: unread
                              ? FontWeight.w700
                              : FontWeight.w500,
                          fontSize: 15,
                        ),
                      ),
                    ),
                    if (unread)
                      Container(
                        width: 8,
                        height: 8,
                        margin: const EdgeInsets.only(left: 8),
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  notification.body,
                  style: const TextStyle(
                    color: Palette.textMuted,
                    height: 1.4,
                    fontSize: 13.5,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Pill(_typeLabel(notification.alertType), color: color),
                    const SizedBox(width: 8),
                    MutedText(timeAgo(notification.createdAt), size: 12),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
