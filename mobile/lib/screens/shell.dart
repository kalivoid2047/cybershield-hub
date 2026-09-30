import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/alerts_state.dart';
import 'account_screen.dart';
import 'alerts_screen.dart';
import 'dashboard_screen.dart';
import 'incidents_screens.dart';
import 'learn_screen.dart';

/// Signed-in frame: bottom navigation over the five main areas.
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

    return Scaffold(
      // IndexedStack keeps each tab's scroll position and loaded data when switching.
      body: SafeArea(
        bottom: false,
        child: IndexedStack(index: _index, children: pages),
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _go,
        destinations: [
          const NavigationDestination(
            icon: Icon(Icons.space_dashboard_outlined),
            selectedIcon: Icon(Icons.space_dashboard),
            label: 'Home',
          ),
          const NavigationDestination(
            icon: Icon(Icons.school_outlined),
            selectedIcon: Icon(Icons.school),
            label: 'Learn',
          ),
          const NavigationDestination(
            icon: Icon(Icons.report_gmailerrorred_outlined),
            selectedIcon: Icon(Icons.report),
            label: 'Incidents',
          ),
          NavigationDestination(
            icon: Badge(
              isLabelVisible: unread > 0,
              label: Text('$unread'),
              child: const Icon(Icons.notifications_outlined),
            ),
            selectedIcon: Badge(
              isLabelVisible: unread > 0,
              label: Text('$unread'),
              child: const Icon(Icons.notifications),
            ),
            label: 'Alerts',
          ),
          const NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}
