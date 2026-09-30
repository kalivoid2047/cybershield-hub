import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/cybershield_api.dart';
import '../models/models.dart';
import '../theme.dart';
import '../widgets/common.dart';

Color _difficultyColor(String difficulty) {
  switch (difficulty) {
    case 'easy':
      return Palette.success;
    case 'hard':
      return Palette.danger;
    default:
      return Palette.warning;
  }
}

class PhishingTab extends StatefulWidget {
  const PhishingTab({super.key});

  @override
  State<PhishingTab> createState() => _PhishingTabState();
}

class _PhishingTabState extends State<PhishingTab>
    with AutomaticKeepAliveClientMixin {
  @override
  bool get wantKeepAlive => true;

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final api = context.read<CyberShieldApi>();
    return LoadView<List<PhishingSimulation>>(
      load: api.simulations,
      builder: (context, sims, reload) {
        if (sims.isEmpty) {
          return ListView(
            children: const [
              SizedBox(height: 80),
              EmptyView(
                icon: Icons.phishing_outlined,
                title: 'No drills available',
                message: 'Phishing simulations will show up here.',
              ),
            ],
          );
        }
        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          children: [
            const MutedText(
              'Inspect each message and its links, then decide: safe or suspicious? You get coaching on both your verdict and your reasoning.',
            ),
            const SizedBox(height: 14),
            for (final sim in sims)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: AppCard(
                  onTap: () async {
                    await Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) =>
                            PhishingSimulationScreen(simulation: sim),
                      ),
                    );
                    await reload();
                  },
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Pill(
                            titleCase(sim.difficulty),
                            color: _difficultyColor(sim.difficulty),
                          ),
                          const Spacer(),
                          if (sim.latestScore != null)
                            Pill(
                              'Best ${sim.latestScore}%',
                              color: sim.latestScore! >= 70
                                  ? Palette.success
                                  : Palette.warning,
                            ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        sim.title,
                        style: Theme.of(context).textTheme.titleMedium
                            ?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 4),
                      MutedText(sim.scenario, maxLines: 2),
                    ],
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

// -- link inspection (port of the web simulator) --------------------------------

class _UrlReport {
  _UrlReport({
    required this.host,
    required this.scheme,
    required this.path,
    required this.findings,
  });
  final String host;
  final String scheme;
  final String path;
  final List<String> findings;
}

/// Static analysis only — the link is never opened.
_UrlReport? _inspectUrl(String raw, String senderEmail) {
  final uri = Uri.tryParse(raw);
  if (uri == null || !uri.hasAuthority) return null;
  final host = uri.host.toLowerCase();
  final senderDomain = senderEmail.contains('@')
      ? senderEmail.split('@').last.toLowerCase()
      : null;
  final findings = <String>[];

  if (uri.scheme != 'https') findings.add('Connection is not encrypted (HTTP)');
  if (RegExp(r'^\d{1,3}(\.\d{1,3}){3}$').hasMatch(host)) {
    findings.add('Points to a raw IP address instead of a domain');
  }
  if (host.contains('xn--')) {
    findings.add('Uses look-alike (punycode) characters');
  }
  if (uri.userInfo.isNotEmpty) {
    findings.add('Hides the real destination behind an @ sign');
  }
  if (host.split('.').length > 3) findings.add('Unusually many subdomains');
  // Digits swapped into a word (micros0ft, paypa1) is the classic look-alike trick.
  final lookalike = host
      .split('.')
      .where((label) => RegExp(r'[a-z]{3,}[013][a-z]{2,}').hasMatch(label))
      .firstOrNull;
  if (lookalike != null) {
    findings.add(
      'Looks like a spoofed name: "$lookalike" has digits standing in for letters',
    );
  }
  if (RegExp(r'(login|secure|verify|account|update|support)[.-]')
          .hasMatch(host) &&
      host.contains('-')) {
    findings.add(
      'Hyphenated, security-sounding domain (a common phishing pattern)',
    );
  }
  if (senderDomain != null &&
      host != senderDomain &&
      !host.endsWith('.$senderDomain')) {
    findings.add('Domain does not match the sender ($senderDomain)');
  }
  return _UrlReport(
    host: host,
    scheme: uri.scheme,
    path: '${uri.path}${uri.hasQuery ? '?${uri.query}' : ''}',
    findings: findings,
  );
}

// Plausible-sounding observations that are NOT red flags, mixed in so the learner
// has to judge each option instead of ticking everything.
const _decoyFlags = [
  'Addressed to you by name',
  'Professional formatting and logo',
  'Sent during normal business hours',
  'Mentions a real, well-known company',
];

int _seededOrder(String text) {
  var hash = 0;
  for (final unit in text.codeUnits) {
    hash = (hash * 31 + unit) & 0xFFFFFFFF;
  }
  return hash;
}

List<String> _flagPool(PhishingSimulation sim) {
  final pool = {...sim.redFlags, ..._decoyFlags}.toList();
  pool.sort(
    (a, b) =>
        _seededOrder('${sim.id}:$a').compareTo(_seededOrder('${sim.id}:$b')),
  );
  return pool;
}

// -- simulation screen -----------------------------------------------------------

class PhishingSimulationScreen extends StatefulWidget {
  const PhishingSimulationScreen({super.key, required this.simulation});

  final PhishingSimulation simulation;

  @override
  State<PhishingSimulationScreen> createState() =>
      _PhishingSimulationScreenState();
}

class _PhishingSimulationScreenState extends State<PhishingSimulationScreen> {
  late final List<String> _pool = _flagPool(widget.simulation);
  final Set<String> _flags = {};
  final Set<String> _inspected = {};
  String? _verdict;
  PhishingResult? _result;
  bool _busy = false;

  PhishingSimulation get _sim => widget.simulation;

  Future<void> _submit() async {
    setState(() => _busy = true);
    try {
      final result = await context.read<CyberShieldApi>().submitSimulation(
        _sim.id,
        classification: _verdict!,
        flags: _flags.toList(),
        inspectedUrls: _inspected.toList(),
      );
      if (mounted) setState(() => _result = result);
    } on ApiException catch (e) {
      if (mounted) showSnack(context, e.message, error: true);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _retry() => setState(() {
    _result = null;
    _verdict = null;
    _flags.clear();
    _inspected.clear();
  });

  @override
  Widget build(BuildContext context) {
    final result = _result;
    final expectedFlags = result?.redFlags.toSet() ?? const <String>{};

    return Scaffold(
      appBar: AppBar(
        title: Text(_sim.title, style: const TextStyle(fontSize: 17)),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          if (_sim.scenario.isNotEmpty) ...[
            MutedText(_sim.scenario, size: 14),
            const SizedBox(height: 14),
          ],
          _EmailCard(sim: _sim),
          if (_sim.urls.isNotEmpty) ...[
            const SectionTitle('Links in this message'),
            for (final url in _sim.urls)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: _UrlTile(
                  url: url,
                  senderEmail: _sim.senderEmail,
                  inspected: _inspected.contains(url),
                  onInspect: () => setState(() => _inspected.add(url)),
                ),
              ),
          ],
          SectionTitle(
            'Red flags',
            trailing: result == null
                ? const MutedText('Tick what looks wrong', size: 12)
                : null,
          ),
          AppCard(
            padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 6),
            child: Column(
              children: [
                for (final flag in _pool)
                  _FlagTile(
                    flag: flag,
                    checked: _flags.contains(flag),
                    state: result == null
                        ? null
                        : _flagState(flag, expectedFlags),
                    onChanged: result != null
                        ? null
                        : (on) => setState(
                            () => on ? _flags.add(flag) : _flags.remove(flag),
                          ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 18),
          if (result == null) ...[
            const SectionTitle('Your verdict'),
            Row(
              children: [
                Expanded(
                  child: _VerdictButton(
                    label: 'Safe',
                    icon: Icons.verified_outlined,
                    color: Palette.success,
                    selected: _verdict == 'safe',
                    onTap: () => setState(() => _verdict = 'safe'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _VerdictButton(
                    label: 'Suspicious',
                    icon: Icons.warning_amber_rounded,
                    color: Palette.danger,
                    selected: _verdict == 'suspicious',
                    onTap: () => setState(() => _verdict = 'suspicious'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            FilledButton(
              onPressed: (_verdict == null || _busy) ? null : _submit,
              child: _busy
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Submit answer'),
            ),
          ] else
            _ResultCard(result: result, flags: _flags, onRetry: _retry),
        ],
      ),
    );
  }

  String? _flagState(String flag, Set<String> expected) {
    final picked = _flags.contains(flag);
    if (expected.contains(flag)) return picked ? 'caught' : 'missed';
    return picked ? 'wrong' : null;
  }
}

class _EmailCard extends StatelessWidget {
  const _EmailCard({required this.sim});

  final PhishingSimulation sim;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(14),
            color: Palette.surfaceHigh,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  sim.subject,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.person_outline,
                      size: 16,
                      color: Palette.textMuted,
                    ),
                    const SizedBox(width: 6),
                    Expanded(
                      child: Text(
                        '${sim.senderName}  <${sim.senderEmail}>',
                        style: const TextStyle(
                          fontSize: 13,
                          color: Palette.textMuted,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(14),
            child: Text(sim.body, style: const TextStyle(height: 1.5)),
          ),
        ],
      ),
    );
  }
}

class _UrlTile extends StatelessWidget {
  const _UrlTile({
    required this.url,
    required this.senderEmail,
    required this.inspected,
    required this.onInspect,
  });

  final String url;
  final String senderEmail;
  final bool inspected;
  final VoidCallback onInspect;

  @override
  Widget build(BuildContext context) {
    final report = inspected ? _inspectUrl(url, senderEmail) : null;
    return AppCard(
      onTap: inspected ? null : onInspect,
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                inspected ? Icons.visibility : Icons.link,
                size: 18,
                color: Palette.accent,
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  url,
                  style: const TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 12.5,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          MutedText(
            inspected
                ? 'Inspected — nothing was opened'
                : 'Tap to inspect where this link really goes',
            size: 12,
          ),
          if (inspected) ...[
            const SizedBox(height: 10),
            if (report == null)
              const MutedText('Couldn’t analyse this link.')
            else ...[
              Text(
                '${report.scheme}://${report.host}${report.path}',
                style: const TextStyle(fontSize: 12.5, color: Palette.accent),
              ),
              const SizedBox(height: 6),
              if (report.findings.isEmpty)
                const Text(
                  'No obvious warning signs in the address itself.',
                  style: TextStyle(color: Palette.success, fontSize: 13),
                )
              else
                for (final finding in report.findings)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Icon(
                          Icons.warning_amber_rounded,
                          size: 15,
                          color: Palette.warning,
                        ),
                        const SizedBox(width: 6),
                        Expanded(
                          child: Text(
                            finding,
                            style: const TextStyle(fontSize: 13, height: 1.3),
                          ),
                        ),
                      ],
                    ),
                  ),
            ],
          ],
        ],
      ),
    );
  }
}

class _FlagTile extends StatelessWidget {
  const _FlagTile({
    required this.flag,
    required this.checked,
    required this.state,
    required this.onChanged,
  });

  final String flag;
  final bool checked;
  final String? state; // caught | missed | wrong | null
  final ValueChanged<bool>? onChanged;

  @override
  Widget build(BuildContext context) {
    final (label, color) = switch (state) {
      'caught' => ('Correct', Palette.success),
      'missed' => ('Missed', Palette.warning),
      'wrong' => ('Not a red flag', Palette.danger),
      _ => (null, Palette.textMuted),
    };
    return CheckboxListTile(
      value: checked,
      onChanged: onChanged == null ? null : (v) => onChanged!(v ?? false),
      controlAffinity: ListTileControlAffinity.leading,
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 8),
      title: Text(flag, style: const TextStyle(fontSize: 14, height: 1.3)),
      subtitle: label == null
          ? null
          : Text(
              label,
              style: TextStyle(
                color: color,
                fontWeight: FontWeight.w600,
                fontSize: 12,
              ),
            ),
    );
  }
}

class _VerdictButton extends StatelessWidget {
  const _VerdictButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final Color color;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? color.withValues(alpha: 0.15) : Palette.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
        side: BorderSide(
          color: selected ? color : Palette.border,
          width: selected ? 1.8 : 1,
        ),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16),
          child: Column(
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 6),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w700,
                  color: selected ? color : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ResultCard extends StatelessWidget {
  const _ResultCard({
    required this.result,
    required this.flags,
    required this.onRetry,
  });

  final PhishingResult result;
  final Set<String> flags;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final color = result.correct ? Palette.success : Palette.danger;
    final missed = result.redFlags.where((f) => !flags.contains(f)).toList();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        AppCard(
          accent: color,
          child: Column(
            children: [
              Icon(
                result.correct ? Icons.check_circle : Icons.cancel,
                color: color,
                size: 40,
              ),
              const SizedBox(height: 8),
              Text(
                result.correct ? 'Correct call' : 'Not quite',
                style: TextStyle(
                  color: color,
                  fontSize: 18,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Score ${result.score}%',
                style: const TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                ),
              ),
              const SizedBox(height: 6),
              MutedText(
                'This message was ${result.expected == 'suspicious' ? 'a phishing attempt' : 'legitimate'}.',
                align: TextAlign.center,
              ),
              if (missed.isNotEmpty) ...[
                const SizedBox(height: 4),
                MutedText(
                  'You missed ${missed.length} red ${missed.length == 1 ? 'flag' : 'flags'} — see the highlighted items above.',
                  align: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
        if (result.trainingTip.isNotEmpty) ...[
          const SizedBox(height: 12),
          AppCard(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(
                  Icons.lightbulb_outline,
                  color: Palette.warning,
                  size: 20,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    result.trainingTip,
                    style: const TextStyle(height: 1.4),
                  ),
                ),
              ],
            ),
          ),
        ],
        const SizedBox(height: 14),
        OutlinedButton.icon(
          onPressed: onRetry,
          icon: const Icon(Icons.replay),
          label: const Text('Try again'),
        ),
      ],
    );
  }
}
