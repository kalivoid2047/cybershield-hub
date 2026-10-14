import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import 'api/api_client.dart';
import 'api/cybershield_api.dart';
import 'screens/auth_screens.dart';
import 'screens/shell.dart';
import 'state/auth_state.dart';
import 'theme.dart';
import 'widgets/common.dart';
import 'widgets/glass.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // Edge-to-edge: the aurora background runs under transparent system bars.
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.edgeToEdge);
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.light,
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.light,
    ),
  );
  final client = ApiClient();
  final api = CyberShieldApi(client);
  final auth = AuthState(client, api)..bootstrap();
  runApp(CyberShieldApp(client: client, api: api, auth: auth));
}

class CyberShieldApp extends StatelessWidget {
  const CyberShieldApp({
    super.key,
    required this.client,
    required this.api,
    required this.auth,
  });

  final ApiClient client;
  final CyberShieldApi api;
  final AuthState auth;

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        Provider<ApiClient>.value(value: client),
        Provider<CyberShieldApi>.value(value: api),
        ChangeNotifierProvider<AuthState>.value(value: auth),
      ],
      child: MaterialApp(
        title: 'CyberShield Hub',
        debugShowCheckedModeBanner: false,
        theme: buildTheme(),
        builder: (context, child) => AuroraBackground(child: child!),
        home: const _Root(),
      ),
    );
  }
}

/// Chooses between splash, sign-in and the signed-in shell based on session state.
class _Root extends StatefulWidget {
  const _Root();

  @override
  State<_Root> createState() => _RootState();
}

class _RootState extends State<_Root> {
  AuthStatus? _previous;

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthState>();
    // Screens pushed on top of the shell (a lesson, a quiz) would otherwise stay
    // visible over the sign-in page when the session ends underneath them.
    if (auth.status == AuthStatus.signedOut &&
        _previous != AuthStatus.signedOut) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) Navigator.of(context).popUntil((route) => route.isFirst);
      });
    }
    _previous = auth.status;
    switch (auth.status) {
      case AuthStatus.starting:
        return const Scaffold(body: Center(child: CircularProgressIndicator()));
      case AuthStatus.unreachable:
        return Scaffold(
          body: ErrorView(
            message: auth.notice ?? "Can't reach the server.",
            onRetry: auth.bootstrap,
          ),
        );
      case AuthStatus.signedOut:
        return const LoginScreen();
      case AuthStatus.signedIn:
        // Keyed by user so switching accounts never reuses another user's screens or cached data.
        return Shell(key: ValueKey(auth.user!.id));
    }
  }
}
