import 'package:flutter/material.dart';

import '../theme.dart';

/// Minimal Markdown renderer for lesson content, mirroring the web app's
/// MarkdownContent: `##`/`###` headings, paragraphs, ordered/unordered lists,
/// `>` quotes, pipe tables, `**bold**` and `` `code` ``. Built from widgets only,
/// so lesson text can never inject anything.
class MarkdownContent extends StatelessWidget {
  const MarkdownContent(this.source, {super.key});

  final String source;

  @override
  Widget build(BuildContext context) {
    final blocks = _parse(source);
    final base = Theme.of(context).textTheme.bodyMedium!
        .copyWith(height: 1.55, fontSize: 15);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final block in blocks)
          Padding(
            padding: const EdgeInsets.only(bottom: 12),
            child: _render(context, block, base),
          ),
      ],
    );
  }

  Widget _render(BuildContext context, _Block block, TextStyle base) {
    switch (block.type) {
      case _BlockType.h2:
        return Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(
            block.text,
            style: base.copyWith(
              fontSize: 20,
              fontWeight: FontWeight.w700,
              height: 1.3,
            ),
          ),
        );
      case _BlockType.h3:
        return Text(
          block.text,
          style: base.copyWith(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: Palette.accent,
            height: 1.3,
          ),
        );
      case _BlockType.paragraph:
        return Text.rich(_inline(block.text, base));
      case _BlockType.quote:
        return Container(
          padding: const EdgeInsets.fromLTRB(14, 10, 12, 10),
          decoration: BoxDecoration(
            color: Palette.accent.withValues(alpha: 0.08),
            borderRadius: BorderRadius.circular(10),
            border: const Border(
              left: BorderSide(color: Palette.accent, width: 3),
            ),
          ),
          child: Text.rich(
            _inline(block.text, base.copyWith(fontStyle: FontStyle.italic)),
          ),
        );
      case _BlockType.list:
        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var i = 0; i < block.items.length; i++)
              Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SizedBox(
                      width: 26,
                      child: Text(
                        block.ordered ? '${i + 1}.' : '•',
                        style: base.copyWith(
                          color: Palette.accent,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    Expanded(child: Text.rich(_inline(block.items[i], base))),
                  ],
                ),
              ),
          ],
        );
      case _BlockType.table:
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Table(
            defaultColumnWidth: const IntrinsicColumnWidth(),
            border: TableBorder.all(
              color: Palette.border,
              borderRadius: BorderRadius.circular(8),
            ),
            children: [
              TableRow(
                decoration: const BoxDecoration(color: Palette.surfaceHigh),
                children: [
                  for (final cell in block.header)
                    _cell(cell, base, header: true),
                ],
              ),
              for (final row in block.rows)
                TableRow(
                  children: [
                    for (var i = 0; i < block.header.length; i++)
                      _cell(i < row.length ? row[i] : '', base),
                  ],
                ),
            ],
          ),
        );
    }
  }

  Widget _cell(String text, TextStyle base, {bool header = false}) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
    child: ConstrainedBox(
      constraints: const BoxConstraints(maxWidth: 220),
      child: Text.rich(
        _inline(
          text,
          base.copyWith(
            fontSize: 13.5,
            fontWeight: header ? FontWeight.w700 : null,
          ),
        ),
      ),
    ),
  );

  static final _inlinePattern = RegExp(r'(\*\*[^*]+\*\*|`[^`]+`)');

  TextSpan _inline(String text, TextStyle style) {
    final spans = <InlineSpan>[];
    var cursor = 0;
    for (final match in _inlinePattern.allMatches(text)) {
      if (match.start > cursor) {
        spans.add(TextSpan(text: text.substring(cursor, match.start)));
      }
      final token = match.group(0)!;
      if (token.startsWith('**')) {
        spans.add(
          TextSpan(
            text: token.substring(2, token.length - 2),
            style: const TextStyle(
              fontWeight: FontWeight.w700,
              color: Colors.white,
            ),
          ),
        );
      } else {
        spans.add(
          TextSpan(
            text: token.substring(1, token.length - 1),
            style: const TextStyle(
              fontFamily: 'monospace',
              color: Color(0xFFA5F3FC),
              backgroundColor: Color(0x22FFFFFF),
            ),
          ),
        );
      }
      cursor = match.end;
    }
    if (cursor < text.length) spans.add(TextSpan(text: text.substring(cursor)));
    return TextSpan(style: style, children: spans);
  }
}

enum _BlockType { h2, h3, paragraph, quote, list, table }

class _Block {
  _Block(
    this.type, {
    this.text = '',
    this.items = const [],
    this.ordered = false,
    this.header = const [],
    this.rows = const [],
  });

  final _BlockType type;
  final String text;
  final List<String> items;
  final bool ordered;
  final List<String> header;
  final List<List<String>> rows;
}

List<_Block> _parse(String source) {
  final lines = source.replaceAll('\r\n', '\n').split('\n');
  final blocks = <_Block>[];
  final unordered = RegExp(r'^\s*[-*]\s+');
  final ordered = RegExp(r'^\s*\d+\.\s+');
  var i = 0;

  bool special(String line) =>
      RegExp(r'^#{2,3}\s').hasMatch(line) ||
      line.trimLeft().startsWith('|') ||
      RegExp(r'^>\s?').hasMatch(line) ||
      unordered.hasMatch(line) ||
      ordered.hasMatch(line);

  while (i < lines.length) {
    final line = lines[i];
    if (line.trim().isEmpty) {
      i++;
      continue;
    }

    final heading = RegExp(r'^(#{2,3})\s+(.*)$').firstMatch(line);
    if (heading != null) {
      blocks.add(
        _Block(
          heading.group(1)!.length == 2 ? _BlockType.h2 : _BlockType.h3,
          text: heading.group(2)!,
        ),
      );
      i++;
      continue;
    }

    if (line.trimLeft().startsWith('|')) {
      final rows = <List<String>>[];
      while (i < lines.length && lines[i].trimLeft().startsWith('|')) {
        final cells = lines[i]
            .trim()
            .replaceAll(RegExp(r'^\||\|$'), '')
            .split('|')
            .map((c) => c.trim())
            .toList();
        rows.add(cells);
        i++;
      }
      final body = rows
          .skip(1)
          .where(
            (row) => !row.every((cell) => RegExp(r'^:?-+:?$').hasMatch(cell)),
          )
          .toList();
      blocks.add(_Block(_BlockType.table, header: rows.first, rows: body));
      continue;
    }

    if (RegExp(r'^>\s?').hasMatch(line)) {
      final quote = <String>[];
      while (i < lines.length && RegExp(r'^>\s?').hasMatch(lines[i])) {
        quote.add(lines[i].replaceFirst(RegExp(r'^>\s?'), ''));
        i++;
      }
      blocks.add(_Block(_BlockType.quote, text: quote.join(' ')));
      continue;
    }

    if (unordered.hasMatch(line) || ordered.hasMatch(line)) {
      final isOrdered = ordered.hasMatch(line);
      final pattern = isOrdered ? ordered : unordered;
      final items = <String>[];
      while (i < lines.length && pattern.hasMatch(lines[i])) {
        items.add(lines[i].replaceFirst(pattern, ''));
        i++;
      }
      blocks.add(_Block(_BlockType.list, items: items, ordered: isOrdered));
      continue;
    }

    final paragraph = <String>[];
    while (i < lines.length &&
        lines[i].trim().isNotEmpty &&
        !special(lines[i])) {
      paragraph.add(lines[i].trim());
      i++;
    }
    if (paragraph.isEmpty) {
      i++; // defensive: never spin on a line nothing consumed
    } else {
      blocks.add(_Block(_BlockType.paragraph, text: paragraph.join(' ')));
    }
  }
  return blocks;
}
