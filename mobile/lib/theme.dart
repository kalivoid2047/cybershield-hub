import 'package:flutter/material.dart';

/// Palette shared with the web app: deep slate surfaces with a cyan accent.
class Palette {
  static const background = Color(0xFF0B1220);
  static const surface = Color(0xFF131C2E);
  static const surfaceHigh = Color(0xFF1B2740);
  static const border = Color(0xFF243350);
  static const accent = Color(0xFF22D3EE);
  static const textMuted = Color(0xFF94A3B8);
  static const success = Color(0xFF34D399);
  static const warning = Color(0xFFFBBF24);
  static const danger = Color(0xFFF87171);
  static const orange = Color(0xFFFB923C);
}

ThemeData buildTheme() {
  final scheme =
      ColorScheme.fromSeed(
        seedColor: Palette.accent,
        brightness: Brightness.dark,
      ).copyWith(
        primary: Palette.accent,
        onPrimary: const Color(0xFF032830),
        surface: Palette.surface,
        error: Palette.danger,
      );

  OutlineInputBorder border(Color color) => OutlineInputBorder(
    borderRadius: BorderRadius.circular(12),
    borderSide: BorderSide(color: color),
  );

  return ThemeData(
    useMaterial3: true,
    colorScheme: scheme,
    // Transparent so the aurora background (see AuroraBackground) shows through every screen.
    scaffoldBackgroundColor: Colors.transparent,
    canvasColor: Palette.surface,
    dialogTheme: DialogThemeData(
      backgroundColor: Palette.surfaceHigh,
      surfaceTintColor: Colors.transparent,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
    ),
    tabBarTheme: const TabBarThemeData(dividerColor: Colors.transparent),
    appBarTheme: const AppBarTheme(
      backgroundColor: Colors.transparent,
      surfaceTintColor: Colors.transparent,
      elevation: 0,
      scrolledUnderElevation: 0,
    ),
    cardTheme: CardThemeData(
      color: Palette.surface,
      elevation: 0,
      margin: EdgeInsets.zero,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: Palette.border),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: Colors.white.withValues(alpha: 0.07),
      border: border(Palette.border),
      enabledBorder: border(Palette.border),
      focusedBorder: border(Palette.accent),
      errorBorder: border(Palette.danger),
      focusedErrorBorder: border(Palette.danger),
    ),
    filledButtonTheme: FilledButtonThemeData(
      style: FilledButton.styleFrom(
        minimumSize: const Size.fromHeight(50),
        elevation: 8,
        shadowColor: Palette.accent.withValues(alpha: 0.5),
        textStyle: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    outlinedButtonTheme: OutlinedButtonThemeData(
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(48),
        side: const BorderSide(color: Palette.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    ),
    navigationBarTheme: NavigationBarThemeData(
      backgroundColor: Palette.surface,
      indicatorColor: Palette.accent.withValues(alpha: 0.18),
      surfaceTintColor: Colors.transparent,
    ),
    dividerTheme: const DividerThemeData(color: Palette.border, space: 1),
    snackBarTheme: const SnackBarThemeData(behavior: SnackBarBehavior.floating),
  );
}
