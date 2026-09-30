import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../state/alerts_state.dart';
import '../theme.dart';
import '../widgets/glass.dart';
import 'account_screen.dart';
import 'alerts_screen.dart';
import 'dashboard_screen.dart';
import 'incidents_screens.dart';
import 'learn_screen.dart';

/// Signed-in frame: a floating glass navigation bar over the five main areas.
class Shell extends StatefulWidget {
  const Shell({super.key});

  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int _index = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => context.read<AlertsState>().load(),
    );
  }

  void _go(int index) => setState(() => _index = index);

  @override
  Widget build(BuildContext context) {
    final unread = context.select<AlertsState, int>((s) => s.unread);
    final pages = <Widget>[
      DashboardScreen(onOpenTab: _go),
      const LearnScreen(),
      const IncidentsScreen(),
      const AlertsScreen(),
      const AccountScreen(),
    ];
    const items = [
      (Icons.space_dashboard_outlined, Icons.space_dashboard, 'Home'),
      (Icons.school_outlined, Icons.school, 'Learn'),
      (Icons.report_gmailerrorred_outlined, Icons.report, 'Incidents'),
      (Icons.notifications_outlined, Icons.notifications, 'Alerts'),
      (Icons.person_outline, Icons.person, 'Account'),
    ];

    return Scaffold(
      // IndexedStack keeps each tab's scroll position and loaded data when switching.
      body: SafeArea(
        bottom: false,
        child: IndexedStack(index: _index, children: pages),
      ),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 4, 14, 10),
          child: GlassCard(
            radius: 30,
            blur: 24,
            padding: const EdgeInsets.all(6),
            child: Row(
              children: [
                for (var i = 0; i < items.length; i++)
                  Expanded(
                    flex: i == _index ? 3 : 2,
                    child: _NavItem(
                      key: Key('nav-${items[i].$3}'),
                      icon: items[i].$1,
                      selectedIcon: items[i].$2,
                      label: items[i].$3,
                      selected: i == _index,
                      badge: items[i].$3 == 'Alerts' ? unread : 0,
                      onTap: () {
                        HapticFeedback.selectionClick();
                        _go(i);
                      },
                    ),
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    super.key,
    required this.icon,
    required this.selectedIcon,
    required this.label,
    required this.selected,
    required this.badge,
    required this.onTap,
  });

  final IconData icon;
  final IconData selectedIcon;
  final String label;
  final bool selected;
  final int badge;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final glyph = Badge(
      isLabelVisible: badge > 0,
      label: Text('$badge'),
      child: Icon(
        selected ? selectedIcon : icon,
        size: 24,
        color: selected ? Palette.accent : Palette.textMuted,
      ),
    );
    return Semantics(
      button: true,
      selected: selected,
      label: label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: AnimatedContainer(
          duration: reduceMotion(context)
              ? Duration.zero
              : const Duration(milliseconds: 280),
          curve: Curves.easeOutCubic,
          height: 48,
          padding: const EdgeInsets.symmetric(horizontal: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: selected
                ? LinearGradient(
                    colors: [
                      Palette.accent.withValues(alpha: 0.28),
                      Palette.accent.withValues(alpha: 0.10),
                    ],
                  )
                : null,
            border: selected
                ? Border.all(color: Palette.accent.withValues(alpha: 0.4))
                : null,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              glyph,
              // The label only shows on the active tab, which keeps five tabs roomy.
              if (selected)
                Flexible(
                  child: Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: Text(
                      label,
                      maxLines: 1,
                      overflow: TextOverflow.fade,
                      softWrap: false,
                      style: const TextStyle(
                        color: Palette.accent,
                        fontWeight: FontWeight.w700,
                        fontSize: 13,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
