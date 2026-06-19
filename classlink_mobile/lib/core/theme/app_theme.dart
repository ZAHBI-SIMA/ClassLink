import 'package:flutter/material.dart';

class AppTheme {
  static const Color primary   = Color(0xFF2563EB); // blue-600
  static const Color secondary = Color(0xFF7C3AED); // violet-600
  static const Color success   = Color(0xFF16A34A); // green-600
  static const Color warning   = Color(0xFFF59E0B); // amber-500
  static const Color danger    = Color(0xFFDC2626); // red-600
  static const Color surface   = Color(0xFFF8FAFC);
  static const Color card      = Color(0xFFFFFFFF);
  static const Color textMain  = Color(0xFF111827);
  static const Color textSub   = Color(0xFF6B7280);
  static const Color border    = Color(0xFFE5E7EB);

  static ThemeData get light => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.fromSeed(
      seedColor: primary,
      brightness: Brightness.light,
    ),
    scaffoldBackgroundColor: surface,
    appBarTheme: const AppBarTheme(
      backgroundColor: card,
      foregroundColor: textMain,
      elevation: 0,
      centerTitle: false,
      titleTextStyle: TextStyle(
        color: textMain, fontSize: 18, fontWeight: FontWeight.w700,
      ),
    ),
    cardTheme: CardThemeData(
      color: card,
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: border),
      ),
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: primary,
        foregroundColor: Colors.white,
        minimumSize: const Size(double.infinity, 48),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        textStyle: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
    ),
    inputDecorationTheme: InputDecorationTheme(
      filled: true,
      fillColor: card,
      border: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: border),
      ),
      enabledBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: border),
      ),
      focusedBorder: OutlineInputBorder(
        borderRadius: BorderRadius.circular(10),
        borderSide: const BorderSide(color: primary, width: 2),
      ),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    ),
  );
}
