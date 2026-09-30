import 'package:flutter/foundation.dart';

import '../api/api_client.dart';
import '../api/cybershield_api.dart';
import '../models/models.dart';

enum AuthStatus { starting, signedOut, signedIn, unreachable }

/// Owns the signed-in user and the session lifecycle.
class AuthState extends ChangeNotifier {
  AuthState(this.client, this.api) {
    client.onSessionExpired = _handleExpired;
  }

  final ApiClient client;
  final CyberShieldApi api;

  AuthStatus status = AuthStatus.starting;
  AppUser? user;
  String? notice;

  /// Restores a saved session on launch.
  Future<void> bootstrap() async {
    status = AuthStatus.starting;
    notifyListeners();
    await client.loadTokens();
    if (!client.hasSession) {
      status = AuthStatus.signedOut;
      notifyListeners();
      return;
    }
    try {
      user = await api.me();
      status = AuthStatus.signedIn;
    } on ApiException catch (error) {
      // 401 means the tokens are dead; anything else (offline, 5xx) leaves them in
      // place so a retry can succeed without forcing the user to sign in again.
      if (error.statusCode == 401) {
        await client.clearTokens();
        status = AuthStatus.signedOut;
      } else {
        status = AuthStatus.unreachable;
        notice = error.message;
      }
    }
    notifyListeners();
  }

  Future<void> login(String email, String password) async {
    user = await api.login(email.trim().toLowerCase(), password);
    notice = null;
    status = AuthStatus.signedIn;
    notifyListeners();
  }

  Future<void> refreshUser() async {
    try {
      user = await api.me();
      notifyListeners();
    } on ApiException {
      // Non-fatal: the cached profile stays on screen.
    }
  }

  void setUser(AppUser updated) {
    user = updated;
    notifyListeners();
  }

  Future<void> logout() async {
    try {
      await api.logout();
    } on ApiException {
      // Revoking server-side is best effort; the local session is cleared regardless.
    }
    await client.clearTokens();
    user = null;
    status = AuthStatus.signedOut;
    notifyListeners();
  }

  void _handleExpired() {
    client.clearTokens();
    user = null;
    notice = 'Your session expired. Please sign in again.';
    status = AuthStatus.signedOut;
    notifyListeners();
  }

  void clearNotice() => notice = null;
}
