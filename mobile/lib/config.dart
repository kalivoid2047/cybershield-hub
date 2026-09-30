import 'package:flutter/foundation.dart';

/// Base URL of the CyberShield Hub API.
///
/// Override at build/run time:
///   flutter run --dart-define=API_BASE_URL=https://hub.example.com/api/v1
///
/// The defaults target a backend on the development machine: the Android
/// emulator reaches the host through 10.0.2.2, everything else through localhost.
/// (A physical phone needs your computer's LAN address instead.)
String get apiBaseUrl {
  const configured = String.fromEnvironment('API_BASE_URL');
  if (configured.isNotEmpty) return configured.replaceAll(RegExp(r'/+$'), '');
  final isAndroid = !kIsWeb && defaultTargetPlatform == TargetPlatform.android;
  return isAndroid
      ? 'http://10.0.2.2:8000/api/v1'
      : 'http://localhost:8000/api/v1';
}
