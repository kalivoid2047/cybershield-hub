import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../api/cybershield_api.dart';
import '../models/models.dart';

/// Notification list shared by the Alerts tab and the unread badge in the nav bar.
class AlertsState extends ChangeNotifier {
  AlertsState(this.api);

  final CyberShieldApi api;

  List<AppNotification> items = const [];
  bool loading = false;
  String? error;

  int get unread => items.where((n) => !n.isRead).length;

  Future<void> load() async {
    loading = true;
    error = null;
    notifyListeners();
    try {
      items = await api.notifications();
    } on ApiException catch (e) {
      error = e.message;
    }
    loading = false;
    notifyListeners();
  }

  Future<void> markRead(AppNotification notification) async {
    if (notification.isRead) return;
    // Optimistic: flip locally, roll back if the server rejects it.
    final previous = items;
    items = [for (final n in items) n.id == notification.id ? n.asRead() : n];
    notifyListeners();
    try {
      await api.markNotificationRead(notification.id);
    } on ApiException {
      items = previous;
      notifyListeners();
    }
  }

  Future<void> markAllRead() async {
    final previous = items;
    items = [for (final n in items) n.asRead()];
    notifyListeners();
    try {
      await api.markAllNotificationsRead();
    } on ApiException {
      items = previous;
      notifyListeners();
      rethrow;
    }
  }

  void reset() {
    items = const [];
    error = null;
    notifyListeners();
  }
}
