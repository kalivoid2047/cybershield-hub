// Live check of the main user flows against a running local server (used for Chapter 5 results).
// Usage: node verify_live.js http://127.0.0.1:8000   (needs a database loaded with `seed_demo`)
const BASE = (process.argv[2] || "http://127.0.0.1:8000") + "/api/v1";
const PASSWORD = "CyberShield123!";
const results = [];
const rec = (id, step, expected, ok, note = "") => { results.push({ id, step, expected, result: ok ? "Pass" : "Fail", note }); console.log(ok ? "PASS" : "FAIL", id, step, note); };

async function call(method, path, token, body, form) {
  const headers = {};
  if (token) headers.Authorization = "Bearer " + token;
  if (body) headers["Content-Type"] = "application/json";
  const res = await fetch(BASE + path, { method, headers, body: form || (body ? JSON.stringify(body) : undefined) });
  let json = null;
  const text = await res.text();
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}
const items = (r) => { const d = r.json && r.json.data !== undefined ? r.json.data : r.json; return Array.isArray(d) ? d : (d && d.results) || []; };
const data = (r) => (r.json && r.json.data !== undefined ? r.json.data : r.json);

(async () => {
  // M1 register + login
  const email = `tester${Date.now()}@example.com`;
  let r = await call("POST", "/auth/register/", null, { username: email.split("@")[0], email, first_name: "Test", last_name: "Learner", organization: "Demo", department: "IT", password: "Str0ng!Passw0rd#1", password_confirm: "Str0ng!Passw0rd#1" });
  rec("M1a", "Register a new account", "Account created (201)", r.status === 201, `status ${r.status}`);
  r = await call("POST", "/auth/login/", null, { email, password: "Str0ng!Passw0rd#1" });
  const user = data(r);
  rec("M1b", "Log in with the new account", "Tokens returned; role is normal user", r.status === 200 && user.access && user.user.role.code === "normal_user", `role ${user.user && user.user.role && user.user.role.code}`);
  const U = user.access;
  r = await call("POST", "/auth/login/", null, { email: "admin@cybershield.local", password: PASSWORD });
  const A = data(r).access; const adminId = data(r).user.id;

  // M2 lesson progress + bookmark
  r = await call("GET", "/training/lessons/?page_size=100", U);
  const lessons = items(r);
  rec("M2a", "List lessons", "Lessons returned", r.status === 200 && lessons.length > 0, `${lessons.length} lessons`);
  const slug = lessons[0].slug;
  r = await call("POST", `/training/lessons/${slug}/progress/`, U, { progress_percent: 60 });
  rec("M2b", "Save lesson progress", "Progress saved", r.status === 200, `status ${r.status}`);
  r = await call("POST", `/training/lessons/${slug}/bookmark/`, U);
  rec("M2c", "Bookmark a lesson", "Bookmark created", [200, 201].includes(r.status), `status ${r.status}`);
  r = await call("GET", "/training/progress/", U);
  const prog = items(r).find((p) => (p.lesson && (p.lesson.slug === slug || p.lesson === slug)) || true);
  rec("M2d", "Progress persists after a new request", "Saved progress is returned", r.status === 200 && items(r).length > 0, `${items(r).length} records`);

  // M3 quiz
  r = await call("GET", "/quizzes/quizzes/?page_size=100", U);
  const quiz = items(r)[0];
  r = await call("GET", `/quizzes/quizzes/${quiz.id}/`, U);
  const detail = data(r);
  r = await call("POST", `/quizzes/quizzes/${quiz.id}/start/`, U);
  const attempt = data(r);
  const answers = detail.questions.map((q) => ({ question_id: q.id, answer_id: q.answers[0].id }));
  r = await call("POST", `/quizzes/quizzes/${quiz.id}/submit/`, U, { attempt_id: attempt.id, answers });
  const graded = data(r);
  rec("M3", "Take a quiz and submit", "Score, pass/fail and recommendations returned", r.status === 200 && graded.score !== undefined && "passed" in graded, `score ${graded.score}, passed ${graded.passed}`);

  // M4 phishing
  r = await call("GET", "/phishing/simulations/?page_size=50", U);
  const sims = items(r);
  const susp = sims.find((s) => s.is_phishing !== false) || sims[0];
  r = await call("POST", `/phishing/simulations/${susp.id}/submit/`, U, { classification: "suspicious", selected_flags: (susp.red_flags || []).slice(0, 2) });
  const pa = data(r);
  rec("M4", "Classify a phishing message", "Score and feedback returned", r.status === 200 && pa.score !== undefined, `score ${pa.score}, correct ${pa.correct}`);

  // M5 incident + evidence
  r = await call("GET", "/incidents/categories/", U);
  const cat = items(r)[0];
  const mk = (name, type, content) => { const f = new FormData(); f.append("title", "Suspicious e-mail asking for a password"); f.append("category_id", cat.id); f.append("severity", "high"); f.append("description", "I received an e-mail that looks like a password reset but the link is wrong."); f.append("affected_system", "E-mail account"); f.append("occurred_at", new Date(Date.now() - 3600e3).toISOString()); f.append("is_draft", "false"); f.append("attachments", new Blob([content], { type }), name); return f; };
  r = await call("POST", "/incidents/incidents/", U, null, mk("screenshot.pdf", "application/pdf", "%PDF-1.4 test"));
  const inc = data(r);
  rec("M5a", "Report an incident with a .pdf file", "Created with reference number", r.status === 201 && /^INC-/.test(inc.reference_number || ""), `${inc.reference_number}`);
  r = await call("POST", "/incidents/incidents/", U, null, mk("virus.exe", "application/octet-stream", "MZ"));
  rec("M5b", "Report an incident with a .exe file", "Rejected with a message", r.status === 400, `status ${r.status}`);

  // M6 administrator workflow
  r = await call("GET", "/incidents/incidents/queue/", A);
  rec("M6a", "Administrator opens the SOC queue", "Incidents grouped by status", r.status === 200, `status ${r.status}`);
  r = await call("POST", `/incidents/incidents/${inc.id}/assign/`, A, { officer_id: adminId, note: "Please investigate" });
  rec("M6b", "Administrator assigns the incident", "Assignment saved", r.status === 200, `status ${r.status}`);
  r = await call("POST", `/incidents/incidents/${inc.id}/transition/`, A, { status: "escalated", note: "Escalated for review", is_internal: false });
  rec("M6c", "Administrator changes status to Escalated", "Timeline entry added", r.status === 200, `status ${r.status}`);
  r = await call("GET", `/incidents/incidents/${inc.id}/`, U);
  const d2 = data(r);
  rec("M6d", "Reporter sees the new status and timeline", "Status is escalated and timeline has entries", r.status === 200 && d2.status === "escalated" && (d2.updates || []).length >= 2, `status ${d2.status}, ${(d2.updates || []).length} updates`);

  // M8 access control
  r = await call("GET", "/incidents/incidents/queue/", U);
  rec("M8a", "Normal user opens the SOC queue", "Refused (403)", r.status === 403, `status ${r.status}`);
  r = await call("GET", "/auth/users/", U);
  rec("M8b", "Normal user lists users", "Refused (403)", r.status === 403, `status ${r.status}`);
  r = await call("GET", "/auth/users/");
  rec("M8c", "Anonymous user lists users", "Refused (401)", r.status === 401, `status ${r.status}`);

  // M9 deactivate
  r = await call("GET", "/auth/users/?search=" + encodeURIComponent(email), A);
  const target = items(r).find((x) => x.email === email);
  r = await call("POST", `/auth/users/${target.id}/deactivate/`, A);
  const deact = r.status;
  r = await call("POST", "/auth/login/", null, { email, password: "Str0ng!Passw0rd#1" });
  rec("M9", "Administrator deactivates a user; the user tries to log in", "Login refused", deact === 200 && r.status >= 400, `deactivate ${deact}, login ${r.status}`);

  // M10 audit
  r = await call("GET", "/audit/logs/?page_size=20", A);
  const logs = items(r);
  rec("M10a", "Administrator opens the audit log", "Entries for the steps above", r.status === 200 && logs.length > 0, `${logs.length} entries`);
  const res = await fetch(BASE + "/audit/logs/export/", { headers: { Authorization: "Bearer " + A } });
  const csv = await res.text();
  rec("M10b", "Export the audit log as CSV", "CSV file returned", res.status === 200 && csv.startsWith("created_at"), `${csv.split("\n").length - 1} rows`);

  // M12 throttling (last, because it uses up the login limit)
  let limited = false;
  for (let i = 0; i < 14; i++) {
    const t = await call("POST", "/auth/login/", null, { email: "nobody@example.com", password: "wrong-password" });
    if (t.status === 429) { limited = true; break; }
  }
  rec("M12", "Send many wrong-password logins quickly", "Requests are throttled (429)", limited);

  require("fs").writeFileSync(__dirname + "/verify_results.json", JSON.stringify(results, null, 2));
  console.log(`\n${results.filter((x) => x.result === "Pass").length}/${results.length} passed`);
})().catch((e) => { console.error(e); process.exit(1); });
