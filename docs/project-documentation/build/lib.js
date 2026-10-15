// Helpers for building the project documentation Word files with the `docx` npm package.
const fs = require("fs");
const path = require("path");
const D = require("docx");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, ImageRun, HeadingLevel, AlignmentType, WidthType,
  ShadingType, BorderStyle, LevelFormat, PageBreak, Footer, Header, PageNumber } = D;

const OUT = path.resolve(__dirname, "..") + path.sep;
const IMG = OUT + "diagrams" + path.sep;
const SCR = OUT + "screens" + path.sep;
const NAVY = "1F3A5F";
const W = 9026; // A4 content width in DXA (1 inch margins)

// Inline **bold** and `code` markers.
function runs(text, base = {}) {
  const out = [];
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0, m;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(new TextRun({ text: text.slice(last, m.index), ...base }));
    const t = m[0];
    if (t.startsWith("**")) out.push(new TextRun({ text: t.slice(2, -2), bold: true, ...base }));
    else out.push(new TextRun({ text: t.slice(1, -1), font: "Consolas", size: 20, ...base }));
    last = m.index + t.length;
  }
  if (last < text.length) out.push(new TextRun({ text: text.slice(last), ...base }));
  return out;
}
const P = (t) => new Paragraph({ children: runs(t), spacing: { after: 120, line: 300 } });
const H1 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun(t)] });
const H2 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun(t)] });
const H3 = (t) => new Paragraph({ heading: HeadingLevel.HEADING_3, children: [new TextRun(t)] });
const B = (t) => new Paragraph({ numbering: { reference: "bul", level: 0 }, children: runs(t), spacing: { after: 60, line: 288 } });
const N = (t, ref = "num") => new Paragraph({ numbering: { reference: ref, level: 0 }, children: runs(t), spacing: { after: 60, line: 288 } });
const code = (lines) => lines.map((l) => new Paragraph({
  children: [new TextRun({ text: l || " ", font: "Consolas", size: 17 })],
  shading: { type: ShadingType.CLEAR, fill: "F3F5F8" }, spacing: { after: 0 }, indent: { left: 120 },
}));
const gap = () => new Paragraph({ children: [], spacing: { after: 120 } });
const brk = () => new Paragraph({ children: [new PageBreak()] });

const bd = { style: BorderStyle.SINGLE, size: 4, color: "B8C2D0" };
const borders = { top: bd, bottom: bd, left: bd, right: bd };
// Table captions are counted automatically so the list of tables stays correct.
let curChapter = 1, tableNo = 0, figureNo = 0;
const tableList = [];
// Call at the start of each chapter so captions read "Table 4.1", "Figure 4.1" and so on.
function chapter(n) { curChapter = n; tableNo = 0; figureNo = 0; }
function table(headers, rows, widths, caption) {
  const tot = widths ? widths.reduce((a, b) => a + b, 0) : W;
  const ws = widths || headers.map(() => Math.floor(W / headers.length));
  const cell = (t, w, head) => new TableCell({
    width: { size: w, type: WidthType.DXA }, borders,
    shading: { type: ShadingType.CLEAR, fill: head ? NAVY : "FFFFFF", color: "auto" },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: String(t).split("\n").map((ln) => new Paragraph({ children: runs(ln, head ? { color: "FFFFFF", bold: true, size: 19 } : { size: 19 }) })),
  });
  const out = [];
  if (caption) {
    tableNo += 1;
    const label = `Table ${curChapter}.${tableNo}: ${caption}`;
    tableList.push(label);
    out.push(new Paragraph({ keepNext: true, spacing: { before: 120, after: 60 }, children: [new TextRun({ text: label, bold: true, size: 19, color: "555555" })] }));
  }
  out.push(new Table({
    width: { size: tot, type: WidthType.DXA }, columnWidths: ws,
    rows: [new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, ws[i], true)) }),
      ...rows.map((r) => new TableRow({ cantSplit: true, children: r.map((c, i) => cell(c, ws[i], false)) }))],
  }), gap());
  return out;
}
// Figures are numbered in the order they appear in the combined document.
const figureList = [];
function figure(dir, name, caption, wpx = 600) {
  figureNo += 1;
  caption = `Figure ${curChapter}.${figureNo}: ${caption}`;
  figureList.push(caption);
  const buf = fs.readFileSync(dir + name);
  const w = buf.readUInt32BE(16), h = buf.readUInt32BE(20);
  return [new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 120, after: 60 }, keepNext: true,
    children: [new ImageRun({ type: "png", data: buf, transformation: { width: wpx, height: Math.round(wpx * h / w) },
      altText: { title: caption, description: caption, name } })] }),
  new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [new TextRun({ text: caption, italics: true, size: 18, color: "555555" })] })];
}
const img = (name, caption, wpx) => figure(IMG, name, caption, wpx);
const shot = (name, caption, wpx = 560) => figure(SCR, name, caption, wpx);

function centred(t, size, o = {}) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: o.after ?? 160 },
    children: [new TextRun({ text: t, size, bold: o.bold, color: o.color, allCaps: o.caps })] });
}
const detailLines = () => [["Student name:", "[Insert student name]"], ["Registration number:", "[Insert registration number]"],
  ["Supervisor:", "[Insert supervisor name]"], ["Academic session:", "ND3 IT, January 2023"]]
  .map(([k, v]) => new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 }, children: [new TextRun({ text: k + " ", bold: true }), new TextRun(v)] }));

function cover(chapterNo, title) {
  return [
    centred("KWEKWE POLYTECHNIC", 36, { bold: true, color: NAVY, after: 80 }),
    centred("National Diploma in Information Technology (ND3 IT)", 24, { after: 40 }),
    centred("Project Documentation", 24, { after: 600 }),
    centred(chapterNo === 8 ? "APPENDICES" : `CHAPTER ${chapterNo}`, 28, { bold: true, color: "888888", after: 80 }),
    centred(title, 44, { bold: true, color: NAVY, caps: true, after: 600 }),
    centred("CyberShield Hub", 36, { bold: true, after: 80 }),
    centred("A Cybersecurity Awareness and Incident Response Platform", 24, { after: 700 }),
    ...detailLines(), brk(),
  ];
}
function signoff() {
  return [gap(), new Paragraph({ border: { top: { style: BorderStyle.SINGLE, size: 6, color: NAVY, space: 6 } }, spacing: { before: 400, after: 120 }, children: [] }),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Date: …………………     Supervisor sign: …………………     Student sign: …………………", size: 20 })] })];
}

function docOptions() {
  return {
    creator: "CyberShield Hub project",
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 32, bold: true, font: "Arial", color: NAVY }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 26, bold: true, font: "Arial", color: NAVY }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1, keepNext: true } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true, run: { size: 23, bold: true, font: "Arial", color: "333333" }, paragraph: { spacing: { before: 200, after: 100 }, outlineLevel: 2, keepNext: true } },
      ],
    },
    numbering: { config: [
      { reference: "bul", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 270 } } } }] },
      ...Array.from({ length: 30 }, (_, i) => ({ reference: i ? "num" + i : "num", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 540, hanging: 360 } } } }] })),
    ] },
  };
}
const pageProps = { page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } };
const headerFooter = (label) => ({
  headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: label, size: 16, color: "888888" })] })] }) },
  footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Kwekwe Polytechnic · ND3 IT · Page ", size: 16, color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "888888" })] })] }) },
});

const registry = [];
// Writes one chapter file and remembers it for the combined document.
async function build(file, chapterNo, title, children) {
  registry.push({ chapterNo, title, children });
  const doc = new Document({ ...docOptions(), title: chapterNo === 8 ? title : `Chapter ${chapterNo}: ${title}`,
    sections: [{ properties: pageProps, ...headerFooter(chapterNo === 8 ? `CyberShield Hub — ${title}` : `CyberShield Hub — Chapter ${chapterNo}: ${title}`),
      children: [...cover(chapterNo, title), ...children.flat(), ...(chapterNo === 8 ? [] : signoff())] }] });
  fs.writeFileSync(OUT + file, await Packer.toBuffer(doc));
  console.log("wrote", file);
}

async function buildCombined(file, front) {
  const lines = (arr) => arr.map((t) => new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: t, size: 20 })] }));
  const frontMatter = [
    centred("KWEKWE POLYTECHNIC", 36, { bold: true, color: NAVY, after: 80 }),
    centred("National Diploma in Information Technology (ND3 IT)", 24, { after: 40 }),
    centred("Project Documentation", 24, { after: 700 }),
    centred("CyberShield Hub", 56, { bold: true, color: NAVY, after: 120 }),
    centred("A Cybersecurity Awareness and Incident Response Platform", 26, { after: 800 }),
    ...detailLines(), brk(),
    ...front.flat(), brk(),
    new Paragraph({ children: [new TextRun({ text: "Contents", bold: true, size: 32, color: NAVY })], spacing: { after: 200 } }),
    new D.TableOfContents("Contents", { hyperlink: true, headingStyleRange: "1-2" }),
  ];
  const body = [];
  [...registry].sort((a, b) => a.chapterNo - b.chapterNo).forEach((ch) => {
    body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, pageBreakBefore: true, spacing: { after: 300 },
      children: [new TextRun({ text: ch.chapterNo === 8 ? ch.title : `Chapter ${ch.chapterNo}: ${ch.title}`, size: 40 })] }));
    body.push(...ch.children.flat(), ...(ch.chapterNo === 8 ? [] : signoff()));
  });
  const doc = new Document({ ...docOptions(), title: "CyberShield Hub: Project Documentation", features: { updateFields: true },
    sections: [{ properties: pageProps, ...headerFooter("CyberShield Hub — Project Documentation"), children: [...frontMatter, ...body] }] });
  fs.writeFileSync(OUT + file, await Packer.toBuffer(doc));
  console.log("wrote", file);
}
// Heading look-alike that is kept out of the table of contents (used for front matter).
const plainHead = (t) => new Paragraph({ keepNext: true, spacing: { before: 360, after: 160 }, children: [new TextRun({ text: t, bold: true, size: 32, color: NAVY })] });
module.exports = { plainHead, chapter, buildCombined, P, H1, H2, H3, B, N, code, gap, brk, table, img, shot, build, W };
