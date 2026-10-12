const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_16x9";
pres.title = "CyberShield Hub - Project Defence";
const NAVY = "0B1F33", TEAL = "14B8A6", INK = "1E293B", MUTE = "64748B", LIGHT = "F1F5F9", RED = "E11D48", WHITE = "FFFFFF";
const F = "Calibri", H = "Cambria";

function content(title, n) {
  const s = pres.addSlide(); s.background = { color: WHITE };
  s.addText(title, { x: 0.6, y: 0.35, w: 8.8, h: 0.7, fontFace: H, fontSize: 30, bold: true, color: NAVY, margin: 0, isTextBox: true });
  s.addText(`CyberShield Hub  |  ${n}`, { x: 0.6, y: 5.2, w: 8.8, h: 0.3, fontFace: F, fontSize: 10, color: MUTE, margin: 0, isTextBox: true });
  return s;
}
function card(s, x, y, w, h, head, body) {
  s.addShape(pres.ShapeType.roundRect, { x, y, w, h, fill: { color: LIGHT }, line: { color: LIGHT }, rectRadius: 0.08 });
  s.addText(head, { x: x + 0.15, y: y + 0.1, w: w - 0.3, h: 0.4, fontFace: F, fontSize: 16, bold: true, color: NAVY, margin: 0, isTextBox: true });
  s.addText(body, { x: x + 0.15, y: y + 0.5, w: w - 0.3, h: h - 0.6, fontFace: F, fontSize: 14, color: INK, margin: 0, valign: "top", isTextBox: true });
}
function dark() { const s = pres.addSlide(); s.background = { color: NAVY }; return s; }

// 1 title
let s = dark();
s.addShape(pres.ShapeType.ellipse, { x: 7.3, y: 1.0, w: 2.4, h: 2.4, fill: { color: TEAL, transparency: 75 }, line: { color: TEAL, width: 2 } });
s.addShape(pres.ShapeType.ellipse, { x: 7.9, y: 1.6, w: 1.2, h: 1.2, fill: { color: TEAL, transparency: 40 }, line: { color: TEAL, width: 2 } });
s.addText("CyberShield Hub", { x: 0.6, y: 1.5, w: 6.6, h: 1.0, fontFace: H, fontSize: 48, bold: true, color: WHITE, margin: 0, isTextBox: true });
s.addText("Enterprise cybersecurity awareness and incident response platform", { x: 0.6, y: 2.6, w: 6.4, h: 0.9, fontFace: F, fontSize: 20, color: "CBD5E1", margin: 0, isTextBox: true });
s.addText("Project Defence", { x: 0.6, y: 4.3, w: 6, h: 0.4, fontFace: F, fontSize: 16, bold: true, color: TEAL, margin: 0, isTextBox: true });
s.addNotes("Introduce yourself and the project: a platform that trains people to avoid attacks and gives the organisation a structured way to respond when they happen.");

// 2 problem
s = content("The problem we set out to solve", 2);
card(s, 0.6, 1.3, 2.8, 2.6, "People are the weak link", "Phishing and social engineering succeed because staff are untrained or untested.");
card(s, 3.6, 1.3, 2.8, 2.6, "Incidents get lost", "Reports arrive by email or chat, with no owner, status or evidence trail.");
card(s, 6.6, 1.3, 2.8, 2.6, "No visibility", "Management cannot measure awareness, risk or response performance.");
s.addText("Goal: one platform that trains, tests, reports, responds and measures.", { x: 0.6, y: 4.25, w: 8.8, h: 0.5, fontFace: F, fontSize: 18, bold: true, color: "0F766E", margin: 0, isTextBox: true });
s.addNotes("Three gaps: awareness, response process, and measurement. The project addresses all three in one system.");

// 3 objectives
s = content("Objectives and scope", 3);
const obj = [["1", "Deliver training and assessment", "Lessons, quizzes and a phishing simulator with scored feedback."], ["2", "Streamline incident response", "Reporting with evidence, SOC queue, assignment and status workflow."], ["3", "Enforce least privilege", "Three roles with permissions checked on every API action."], ["4", "Provide accountability", "Analytics for decisions and an audit log of every change."]];
obj.forEach((o, i) => {
  const y = 1.3 + i * 0.9;
  s.addShape(pres.ShapeType.ellipse, { x: 0.6, y, w: 0.6, h: 0.6, fill: { color: NAVY }, line: { color: NAVY } });
  s.addText(o[0], { x: 0.6, y, w: 0.6, h: 0.6, align: "center", valign: "middle", fontFace: F, fontSize: 18, bold: true, color: WHITE, margin: 0, isTextBox: true });
  s.addText([{ text: o[1], options: { bold: true, fontSize: 18, color: NAVY, breakLine: true } }, { text: o[2], options: { fontSize: 14, color: INK } }], { x: 1.45, y: y - 0.05, w: 8, h: 0.7, fontFace: F, margin: 0, valign: "middle", isTextBox: true });
});
s.addNotes("Scope: web app for all roles plus a Flutter mobile client for learners and reporters.");

// 4 architecture
s = content("System architecture", 4);
const boxes = [["Clients", "React 18 + Vite web app\nFlutter mobile app", 0.6], ["REST API", "Django 5 + DRF\n/api/v1, Swagger docs", 3.55], ["Data", "SQLite (default)\nMySQL 8 supported\nEvidence storage", 6.5]];
boxes.forEach(b => {
  s.addShape(pres.ShapeType.roundRect, { x: b[2], y: 1.4, w: 2.9, h: 1.9, fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.1 });
  s.addText(b[0], { x: b[2] + 0.15, y: 1.5, w: 2.6, h: 0.4, fontFace: F, fontSize: 18, bold: true, color: TEAL, margin: 0, isTextBox: true });
  s.addText(b[1], { x: b[2] + 0.15, y: 2.0, w: 2.6, h: 1.2, fontFace: F, fontSize: 14, color: WHITE, margin: 0, valign: "top", isTextBox: true });
});
s.addText("Request pipeline", { x: 0.6, y: 3.6, w: 5, h: 0.35, fontFace: F, fontSize: 16, bold: true, color: NAVY, margin: 0, isTextBox: true });
["JWT auth", "RBAC check", "Domain service", "Audit log"].forEach((t, i) => {
  s.addShape(pres.ShapeType.roundRect, { x: 0.6 + i * 2.25, y: 4.05, w: 2.0, h: 0.6, fill: { color: LIGHT }, line: { color: TEAL, width: 1.5 }, rectRadius: 0.08 });
  s.addText(t, { x: 0.6 + i * 2.25, y: 4.05, w: 2.0, h: 0.6, align: "center", valign: "middle", fontFace: F, fontSize: 14, bold: true, color: NAVY, margin: 0, isTextBox: true });
});
s.addNotes("Single versioned REST API serves both clients. Each request is authenticated with JWT, authorised by role, handled by a domain service, and mutations are audit logged.");

// 5 modules
s = content("Feature modules", 5);
const mods = [["Training", "Categorised lessons, progress, bookmarks"], ["Quizzes", "Timed, scored, weakness analysis"], ["Phishing lab", "Inspect emails, flag red flags"], ["Incidents", "Report with evidence, track status"], ["SOC queue", "Kanban, assign, escalate"], ["Analytics", "Personal and organisation metrics"], ["Alerts", "Advisories and notifications"], ["Audit log", "Filterable, CSV export"]];
mods.forEach((m, i) => { card(s, 0.6 + (i % 4) * 2.25, 1.3 + Math.floor(i / 4) * 1.85, 2.05, 1.65, m[0], m[1]); });
s.addNotes("Eight modules; the first three build awareness, the next two handle response, the last three give oversight.");

// 6 RBAC
s = content("Role-based access control", 6);
const hdr = (t) => ({ text: t, options: { bold: true, color: WHITE, fill: { color: NAVY }, align: "center" } });
const Y = () => ({ text: "Yes", options: { align: "center", color: "0F766E", bold: true } });
const N = () => ({ text: "No", options: { align: "center", color: RED } });
const rows = [[hdr("Capability"), hdr("User"), hdr("Officer"), hdr("Admin")],
  ["Training, quizzes, phishing", Y(), Y(), Y()], ["Report own incidents", Y(), Y(), Y()], ["Manage all incidents", N(), Y(), Y()],
  ["Organisation analytics", N(), Y(), Y()], ["Manage alerts, view audit log", N(), Y(), Y()], ["Manage users and roles", N(), N(), Y()]];
s.addTable(rows, { x: 0.6, y: 1.3, w: 8.8, colW: [4.6, 1.4, 1.4, 1.4], fontFace: F, fontSize: 15, color: INK, border: { type: "solid", pt: 0.5, color: "CBD5E1" }, rowH: 0.46 });
s.addNotes("Permissions are enforced per viewset and action on the server, not only hidden in the UI.");

// 7 incident workflow
s = content("Incident response workflow", 7);
["Report", "Triage", "Assign", "Investigate", "Resolve"].forEach((t, i) => {
  const x = 0.6 + i * 1.8;
  s.addShape(pres.ShapeType.roundRect, { x, y: 1.4, w: 1.55, h: 0.8, fill: { color: i == 0 ? "0F766E" : NAVY }, line: { color: i == 0 ? "0F766E" : NAVY }, rectRadius: 0.1 });
  s.addText(t, { x, y: 1.4, w: 1.55, h: 0.8, align: "center", valign: "middle", fontFace: F, fontSize: 16, bold: true, color: WHITE, margin: 0, isTextBox: true });
});
card(s, 0.6, 2.7, 2.8, 2.2, "Intake", "Auto reference number, drafts, evidence upload with file type and size checks.");
card(s, 3.6, 2.7, 2.8, 2.2, "SOC queue", "Officers see a Kanban queue, assign owners, escalate and change status.");
card(s, 6.6, 2.7, 2.8, 2.2, "Timeline", "Every transition is recorded, with internal notes visible to staff only.");
s.addNotes("Show the demo here if time allows: report as user, then work it as officer.");

// 8 security
s = content("Security measures", 8);
const sec = [["JWT with rotation", "Short-lived access tokens, refresh rotation and blacklist, session revocation."], ["Abuse protection", "Throttling on anonymous, authenticated and auth endpoints; login attempt tracking."], ["Input safety", "ORM-only queries, evidence allow-list and size limits, CSRF and security headers."], ["Accountability", "Every mutating request audit logged; standardised error responses."]];
sec.forEach((c, i) => card(s, 0.6 + (i % 2) * 4.5, 1.3 + Math.floor(i / 2) * 1.85, 4.3, 1.65, c[0], c[1]));
s.addNotes("A security-awareness product must itself be secure. Production flags: HTTPS redirect, secure cookies, HSTS.");

// 9 tech stack
s = content("Technology choices", 9);
const tech = [["Backend", "Python 3.12, Django 5, DRF, Simple JWT, drf-spectacular"], ["Web", "React 18, Vite, Tailwind CSS, Chart.js, Framer Motion"], ["Mobile", "Flutter client, tokens in platform keystore, HTTPS-only release builds"], ["Database", "SQLite for zero-setup; MySQL 8 via one environment variable"]];
tech.forEach((t, i) => {
  const y = 1.3 + i * 0.95;
  s.addShape(pres.ShapeType.roundRect, { x: 0.6, y, w: 2.0, h: 0.75, fill: { color: NAVY }, line: { color: NAVY }, rectRadius: 0.08 });
  s.addText(t[0], { x: 0.6, y, w: 2.0, h: 0.75, align: "center", valign: "middle", fontFace: F, fontSize: 16, bold: true, color: WHITE, margin: 0, isTextBox: true });
  s.addText(t[1], { x: 2.85, y, w: 6.5, h: 0.75, valign: "middle", fontFace: F, fontSize: 16, color: INK, margin: 0, isTextBox: true });
});
s.addNotes("Mature, well documented tools chosen for maintainability. API-first design let web and mobile share one backend.");

// 10 testing
s = content("Testing and quality", 10);
card(s, 0.6, 1.3, 4.3, 3.5, "Backend: pytest", [
  { text: "Suites per app covering:", options: { breakLine: true } },
  { text: "Auth and RBAC permissions", options: { bullet: true, breakLine: true } },
  { text: "Quiz and phishing grading", options: { bullet: true, breakLine: true } },
  { text: "Incident workflow and evidence upload", options: { bullet: true, breakLine: true } },
  { text: "Alerts, audit logging, analytics", options: { bullet: true } }]);
card(s, 5.1, 1.3, 4.3, 3.5, "Mobile and docs", "Flutter client tests pass; recent fixes covered narrow-screen layout and evidence validation. API documented via Swagger at /api/v1/docs/ and a full project report.");
s.addNotes("Run pytest live if asked. Be ready to point at the evidence validation tests.");

// 11 challenges
s = content("Challenges and lessons learned", 11);
[["Enforcing RBAC consistently", "Centralised permission classes instead of per-view checks."], ["Safe file uploads", "Allow-listed types and size limits validated server-side."], ["Phones and small screens", "Fixed footer overflow on narrow alert cards."], ["Trustworthy grading", "Scoring lives in tested service functions."]].forEach((c, i) => {
  const y = 1.3 + i * 0.95;
  s.addText(c[0], { x: 0.6, y, w: 3.6, h: 0.8, valign: "middle", fontFace: F, fontSize: 17, bold: true, color: NAVY, margin: 0, isTextBox: true });
  s.addText(c[1], { x: 4.4, y, w: 5, h: 0.8, valign: "middle", fontFace: F, fontSize: 15, color: INK, margin: 0, isTextBox: true });
});
s.addNotes("Tie each challenge to a concrete decision in the code.");

// 12 conclusion
s = dark();
s.addText("Conclusion and future work", { x: 0.6, y: 0.5, w: 8.8, h: 0.8, fontFace: H, fontSize: 36, bold: true, color: WHITE, margin: 0, isTextBox: true });
s.addText([{ text: "Delivered", options: { bold: true, color: TEAL, fontSize: 20, breakLine: true } },
  { text: "Training, testing, incident response, analytics and audit in one secured platform on web and mobile.", options: { color: WHITE, fontSize: 16 } }], { x: 0.6, y: 1.6, w: 4.2, h: 2.2, fontFace: F, margin: 0, valign: "top", isTextBox: true });
s.addText([{ text: "Next steps", options: { bold: true, color: TEAL, fontSize: 20, breakLine: true } },
  { text: "Email-based phishing campaigns", options: { bullet: true, color: WHITE, fontSize: 16, breakLine: true } },
  { text: "Multi-factor authentication", options: { bullet: true, color: WHITE, fontSize: 16, breakLine: true } },
  { text: "SIEM integration and production hosting", options: { bullet: true, color: WHITE, fontSize: 16 } }], { x: 5.2, y: 1.6, w: 4.2, h: 2.2, fontFace: F, margin: 0, valign: "top", isTextBox: true });
s.addText("Thank you. Questions?", { x: 0.6, y: 4.4, w: 8.8, h: 0.5, fontFace: F, fontSize: 22, bold: true, color: TEAL, margin: 0, isTextBox: true });
s.addNotes("Summarise, then invite questions.");

pres.writeFile({ fileName: "CyberShield_Hub_Defence.pptx" }).then(() => console.log("ok"));
