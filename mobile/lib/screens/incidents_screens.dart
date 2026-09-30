import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../api/api_client.dart';
import '../api/cybershield_api.dart';
import '../models/models.dart';
import '../state/auth_state.dart';
import '../theme.dart';
import '../widgets/common.dart';

class IncidentsScreen extends StatelessWidget {
  const IncidentsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final api = context.read<CyberShieldApi>();
    final isStaff = context.select<AuthState, bool>(
      (s) => s.user?.isStaff ?? false,
    );
    return LoadView<List<Incident>>(
      load: api.incidents,
      builder: (context, incidents, reload) {
        Future<void> openReport() async {
          final created = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (_) => const IncidentReportScreen()),
          );
          if (created == true) await reload();
        }

        return ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 96),
          children: [
            Text(
              isStaff ? 'All incidents' : 'My incidents',
              style: Theme.of(context).textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 4),
            MutedText(
              isStaff ? 'Everything reported across the organisation.' : 'Anything you’ve reported, and how the security team is handling it.',
            ),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: openReport,
              icon: const Icon(Icons.add),
              label: const Text('Report an incident'),
            ),
            const SizedBox(height: 16),
            if (incidents.isEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 40),
                child: EmptyView(
                  icon: Icons.shield_outlined,
                  title: 'No incidents reported',
                  message: 'See something suspicious? Report it — early reports stop small problems becoming big ones.',
                ),
              )
            else
              for (final incident in incidents)
                Padding(
                  padding: const EdgeInsets.only(bottom: 10),
                  child: AppCard(
                    onTap: () async {
                      await Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) =>
                              IncidentDetailScreen(incidentId: incident.id),
                        ),
                      );
                      await reload();
                    },
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Wrap(
                                spacing: 6,
                                runSpacing: 4,
                                children: [
                                  Pill(
                                    titleCase(incident.severity),
                                    color: severityColor(incident.severity),
                                  ),
                                  Pill(
                                    incident.isDraft
                                        ? 'Draft'
                                        : titleCase(incident.status),
                                    color: incident.isDraft
                                        ? Palette.textMuted
                                        : statusColor(incident.status),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            MutedText(incident.reference, size: 11.5),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          incident.title,
                          style: Theme.of(context).textTheme.titleMedium
                              ?.copyWith(fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        MutedText(
                          '${incident.categoryName} · ${timeAgo(incident.createdAt)}',
                        ),
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

// -- detail --------------------------------------------------------------------

class IncidentDetailScreen extends StatelessWidget {
  const IncidentDetailScreen({super.key, required this.incidentId});

  final int incidentId;

  @override
  Widget build(BuildContext context) {
    final api = context.read<CyberShieldApi>();
    return Scaffold(
      appBar: AppBar(title: const Text('Incident')),
      body: LoadView<Incident>(
        load: () => api.incident(incidentId),
        builder: (context, incident, _) => ListView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(20),
          children: [
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: [
                Pill(
                  titleCase(incident.severity),
                  color: severityColor(incident.severity),
                ),
                Pill(
                  incident.isDraft ? 'Draft' : titleCase(incident.status),
                  color: incident.isDraft
                      ? Palette.textMuted
                      : statusColor(incident.status),
                ),
                Pill(incident.categoryName, color: Palette.textMuted),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              incident.title,
              style: Theme.of(context).textTheme.headlineSmall
                  ?.copyWith(fontWeight: FontWeight.w800, height: 1.25),
            ),
            const SizedBox(height: 4),
            MutedText(incident.reference),
            const SizedBox(height: 18),
            AppCard(
              child: Column(
                children: [
                  _Fact('Occurred', formatDateTime(incident.occurredAt)),
                  if (incident.affectedSystem.isNotEmpty)
                    _Fact('Affected system', incident.affectedSystem),
                  _Fact(
                    'Assigned to',
                    incident.assignedTo ?? 'Awaiting triage',
                  ),
                ],
              ),
            ),
            const SectionTitle('What happened'),
            Text(incident.description, style: const TextStyle(height: 1.5)),
            const SectionTitle('Timeline'),
            if (incident.updates.isEmpty)
              const MutedText('No updates yet.')
            else
              for (final update in incident.updates.reversed)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        margin: const EdgeInsets.only(top: 5),
                        width: 10,
                        height: 10,
                        decoration: BoxDecoration(
                          color: update.statusTo.isEmpty
                              ? Palette.textMuted
                              : statusColor(update.statusTo),
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              update.note.isEmpty
                                  ? 'Status: ${titleCase(update.statusTo)}'
                                  : update.note,
                              style: const TextStyle(height: 1.4),
                            ),
                            const SizedBox(height: 2),
                            MutedText(
                              '${update.actor} · ${formatDateTime(update.createdAt)}',
                              size: 12,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
          ],
        ),
      ),
    );
  }
}

class _Fact extends StatelessWidget {
  const _Fact(this.label, this.value);

  final String label;
  final String value;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(width: 120, child: MutedText(label)),
          Expanded(child: Text(value, style: const TextStyle(fontSize: 14))),
        ],
      ),
    );
  }
}

// -- report form ---------------------------------------------------------------

class IncidentReportScreen extends StatefulWidget {
  const IncidentReportScreen({super.key});

  @override
  State<IncidentReportScreen> createState() => _IncidentReportScreenState();
}

class _IncidentReportScreenState extends State<IncidentReportScreen> {
  static const _severities = ['low', 'medium', 'high', 'critical'];

  final _form = GlobalKey<FormState>();
  final _title = TextEditingController();
  final _system = TextEditingController();
  final _description = TextEditingController();

  late Future<List<IncidentCategory>> _categories;
  IncidentCategory? _category;
  String _severity = 'medium';
  DateTime _occurredAt = DateTime.now();
  bool _busy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _categories = context.read<CyberShieldApi>().incidentCategories();
  }

  @override
  void dispose() {
    _title.dispose();
    _system.dispose();
    _description.dispose();
    super.dispose();
  }

  Future<void> _pickWhen() async {
    final now = DateTime.now();
    final date = await showDatePicker(
      context: context,
      initialDate: _occurredAt,
      firstDate: now.subtract(const Duration(days: 365)),
      lastDate: now,
    );
    if (date == null || !mounted) return;
    final time = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(_occurredAt),
    );
    if (time == null) return;
    var picked = DateTime(
      date.year,
      date.month,
      date.day,
      time.hour,
      time.minute,
    );
    if (picked.isAfter(now)) {
      picked = now; // an incident can't have happened in the future
    }
    setState(() => _occurredAt = picked);
  }

  Future<void> _submit() async {
    if (!_form.currentState!.validate()) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    final navigator = Navigator.of(context);
    try {
      await context.read<CyberShieldApi>().reportIncident(
        title: _title.text.trim(),
        categoryId: _category!.id,
        severity: _severity,
        description: _description.text.trim(),
        affectedSystem: _system.text.trim(),
        occurredAt: _occurredAt,
      );
      navigator.pop(true);
    } on ApiException catch (e) {
      if (mounted) setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Report an incident')),
      body: FutureBuilder<List<IncidentCategory>>(
        future: _categories,
        builder: (context, snapshot) {
          if (snapshot.connectionState != ConnectionState.done) {
            return const Center(child: CircularProgressIndicator());
          }
          if (snapshot.hasError) {
            return ErrorView(
              message: snapshot.error.toString(),
              onRetry: () => setState(() {
                _categories = context
                    .read<CyberShieldApi>()
                    .incidentCategories();
              }),
            );
          }
          final categories = snapshot.data!;
          return Form(
            key: _form,
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                if (_error != null) ...[
                  ErrorBanner(_error!),
                  const SizedBox(height: 14),
                ],
                TextFormField(
                  controller: _title,
                  textInputAction: TextInputAction.next,
                  maxLength: 220,
                  decoration: const InputDecoration(
                    labelText: 'Title',
                    hintText: 'e.g. Suspicious email asking for my password',
                  ),
                  validator: (v) => (v == null || v.trim().isEmpty)
                      ? 'Give the incident a short title.'
                      : null,
                ),
                const SizedBox(height: 6),
                DropdownButtonFormField<IncidentCategory>(
                  initialValue: _category,
                  isExpanded: true,
                  decoration: const InputDecoration(labelText: 'Category'),
                  items: [
                    for (final c in categories)
                      DropdownMenuItem(
                        value: c,
                        child: Text(c.name, overflow: TextOverflow.ellipsis),
                      ),
                  ],
                  onChanged: (c) => setState(() {
                    _category = c;
                    // The category suggests a starting severity; the reporter can still change it.
                    if (c != null && _severities.contains(c.defaultSeverity)) {
                      _severity = c.defaultSeverity;
                    }
                  }),
                  validator: (c) => c == null ? 'Choose a category.' : null,
                ),
                const SizedBox(height: 18),
                const Text(
                  'Severity',
                  style: TextStyle(fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8,
                  children: [
                    for (final s in _severities)
                      ChoiceChip(
                        label: Text(titleCase(s)),
                        selected: _severity == s,
                        selectedColor: severityColor(s).withValues(alpha: 0.25),
                        onSelected: (_) => setState(() => _severity = s),
                      ),
                  ],
                ),
                const SizedBox(height: 18),
                InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: _pickWhen,
                  child: InputDecorator(
                    decoration: const InputDecoration(
                      labelText: 'When did it happen?',
                      suffixIcon: Icon(Icons.event),
                    ),
                    child: Text(formatDateTime(_occurredAt)),
                  ),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _system,
                  textInputAction: TextInputAction.next,
                  decoration: const InputDecoration(
                    labelText: 'Affected system (optional)',
                    hintText: 'e.g. Work laptop, payroll portal',
                  ),
                ),
                const SizedBox(height: 14),
                TextFormField(
                  controller: _description,
                  minLines: 5,
                  maxLines: 10,
                  textCapitalization: TextCapitalization.sentences,
                  decoration: const InputDecoration(
                    labelText: 'What happened?',
                    alignLabelWithHint: true,
                    hintText: 'What did you see, and what did you do about it?',
                  ),
                  validator: (v) => (v == null || v.trim().length < 10)
                      ? 'Describe what happened (at least a sentence).'
                      : null,
                ),
                const SizedBox(height: 22),
                FilledButton(
                  onPressed: _busy ? null : _submit,
                  child: _busy
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Submit report'),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
