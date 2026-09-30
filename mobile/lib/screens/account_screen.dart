import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/cybershield_api.dart';
import '../config.dart';
import '../state/alerts_state.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/common.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthState>().user!;
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text(
          'Account',
          style: Theme.of(context).textTheme.headlineSmall
              ?.copyWith(fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 16),
        AppCard(
          child: Row(
            children: [
              CircleAvatar(
                radius: 28,
                backgroundColor: Palette.accent.withValues(alpha: 0.18),
                child: Text(
                  user.initials,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                    color: Palette.accent,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.fullName,
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 17,
                      ),
                    ),
                    const SizedBox(height: 2),
                    MutedText(user.email),
                    const SizedBox(height: 8),
                    Pill(
                      user.roleName.isEmpty
                          ? titleCase(user.roleCode)
                          : user.roleName,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        AppCard(
          padding: const EdgeInsets.symmetric(vertical: 6),
          child: Column(
            children: [
              _Row(
                Icons.business_outlined,
                'Organisation',
                user.organization.isEmpty ? 'Not set' : user.organization,
              ),
              const Divider(),
              _Row(
                Icons.groups_outlined,
                'Department',
                user.department.isEmpty ? 'Not set' : user.department,
              ),
              const Divider(),
              _Row(
                Icons.shield_outlined,
                'Security score',
                '${user.securityScore} / 100',
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),
        OutlinedButton.icon(
          onPressed: () => Navigator.of(
            context,
          ).push(MaterialPageRoute(builder: (_) => const EditProfileScreen())),
          icon: const Icon(Icons.edit_outlined),
          label: const Text('Edit profile'),
        ),
        const SizedBox(height: 10),
        OutlinedButton.icon(
          onPressed: () => Navigator.of(context).push(
            MaterialPageRoute(builder: (_) => const ChangePasswordScreen()),
          ),
          icon: const Icon(Icons.lock_reset),
          label: const Text('Change password'),
        ),
        const SizedBox(height: 10),
        FilledButton.icon(
          style: FilledButton.styleFrom(
            backgroundColor: Palette.danger.withValues(alpha: 0.9),
            foregroundColor: Colors.white,
          ),
          onPressed: () => _confirmSignOut(context),
          icon: const Icon(Icons.logout),
          label: const Text('Sign out'),
        ),
        const SizedBox(height: 20),
        MutedText('Server: $apiBaseUrl', size: 11, align: TextAlign.center),
      ],
    );
  }

  Future<void> _confirmSignOut(BuildContext context) async {
    final auth = context.read<AuthState>();
    final alerts = context.read<AlertsState>();
    final ok = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Sign out'),
          ),
        ],
      ),
    );
    if (ok == true) {
      alerts.reset();
      await auth.logout();
    }
  }
}

class _Row extends StatelessWidget {
  const _Row(this.icon, this.label, this.value);

  final IconData icon;
  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Palette.textMuted),
          const SizedBox(width: 12),
          Expanded(child: Text(label)),
          Flexible(
            child: Text(
              value,
              textAlign: TextAlign.end,
              style: const TextStyle(color: Palette.textMuted),
            ),
          ),
        ],
      ),
    );
  }
}

class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _form = GlobalKey<FormState>();
  late final TextEditingController _first;
  late final TextEditingController _last;
  late final TextEditingController _organization;
  late final TextEditingController _department;
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthState>().user!;
    _first = TextEditingController(text: user.firstName);
    _last = TextEditingController(text: user.lastName);
    _organization = TextEditingController(text: user.organization);
    _department = TextEditingController(text: user.department);
  }

  @override
  void dispose() {
    for (final c in [_first, _last, _organization, _department]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final auth = context.read<AuthState>();
    final navigator = Navigator.of(context);
    try {
      final updated = await context.read<CyberShieldApi>().updateProfile({
        'first_name': _first.text.trim(),
        'last_name': _last.text.trim(),
        'organization': _organization.text.trim(),
        'department': _department.text.trim(),
      });
      auth.setUser(updated);
      navigator.pop();
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Edit profile')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (_error != null) ...[
              ErrorBanner(_error!),
              const SizedBox(height: 14),
            ],
            TextFormField(
              controller: _first,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(labelText: 'First name'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required.' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _last,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(labelText: 'Last name'),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Required.' : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _organization,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(labelText: 'Organisation'),
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _department,
              decoration: const InputDecoration(labelText: 'Department'),
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: _busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Save changes'),
            ),
          ],
        ),
      ),
    );
  }
}

class ChangePasswordScreen extends StatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  State<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends State<ChangePasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _current = TextEditingController();
  final _next = TextEditingController();
  final _confirm = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    for (final c in [_current, _next, _confirm]) {
      c.dispose();
    }
    super.dispose();
  }

  Future<void> _save() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final navigator = Navigator.of(context);
    final messenger = ScaffoldMessenger.of(context);
    try {
      await context.read<CyberShieldApi>().changePassword(
        _current.text,
        _next.text,
      );
      navigator.pop();
      messenger.showSnackBar(
        const SnackBar(content: Text('Password changed.')),
      );
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Change password')),
      body: Form(
        key: _form,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            if (_error != null) ...[
              ErrorBanner(_error!),
              const SizedBox(height: 14),
            ],
            TextFormField(
              controller: _current,
              obscureText: true,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(labelText: 'Current password'),
              validator: (v) => (v == null || v.isEmpty)
                  ? 'Enter your current password.'
                  : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _next,
              obscureText: true,
              textInputAction: TextInputAction.next,
              decoration: const InputDecoration(
                labelText: 'New password',
                helperText: 'At least 10 characters.',
              ),
              validator: (v) => (v == null || v.length < 10)
                  ? 'Use at least 10 characters.'
                  : null,
            ),
            const SizedBox(height: 14),
            TextFormField(
              controller: _confirm,
              obscureText: true,
              onFieldSubmitted: (_) => _save(),
              decoration: const InputDecoration(
                labelText: 'Confirm new password',
              ),
              validator: (v) =>
                  v != _next.text ? 'Passwords do not match.' : null,
            ),
            const SizedBox(height: 22),
            FilledButton(
              onPressed: _busy ? null : _save,
              child: _busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Update password'),
            ),
          ],
        ),
      ),
    );
  }
}
