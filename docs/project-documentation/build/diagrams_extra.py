"""Extra diagrams for the project documentation (Gantt, flowcharts, activity, extra level 2 DFDs,
deployment and module structure). Run: python diagrams_extra.py"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Ellipse, Rectangle, FancyArrowPatch, Polygon

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams") + os.sep
NAVY = "#1f3a5f"
ARRZ = 3


def fig(w, h):
    f, a = plt.subplots(figsize=(w, h))
    a.set_xlim(0, w * 10)
    a.set_ylim(0, h * 10)
    a.axis("off")
    return f, a


def save(f, name, title):
    f.tight_layout()
    f.savefig(OUT + name, dpi=130)
    plt.close(f)


def arr(a, p, q, t="", off=(0, 1.5), rad=0, ls="-", fs=7, style="-|>"):
    a.add_patch(FancyArrowPatch(p, q, arrowstyle=style, mutation_scale=11, color="#333", lw=1.1,
                                connectionstyle=f"arc3,rad={rad}", linestyle=ls, zorder=ARRZ))
    if t:
        a.text((p[0] + q[0]) / 2 + off[0], (p[1] + q[1]) / 2 + off[1], t, ha="center", va="center", fontsize=fs,
               bbox=dict(fc="white", ec="none", pad=0.6), zorder=5)


def elbow(a, pts, ls="-"):
    """Polyline with an arrow head on the last segment only."""
    for p, q in zip(pts[:-2], pts[1:-1]):
        a.plot([p[0], q[0]], [p[1], q[1]], color="#333", lw=1.1, linestyle=ls, zorder=3)
    arr(a, pts[-2], pts[-1], ls=ls)


def term(a, x, y, t, w=18, h=6):
    a.add_patch(FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle="round,pad=0.3,rounding_size=3", fc="#d9ead3", ec="#2e7d32", lw=1.4, zorder=2))
    a.text(x, y, t, ha="center", va="center", fontsize=8, fontweight="bold", zorder=4)


def step(a, x, y, t, w=24, h=7, fc="#e8eef7"):
    a.add_patch(Rectangle((x - w / 2, y - h / 2), w, h, fc=fc, ec=NAVY, lw=1.3, zorder=2))
    a.text(x, y, t, ha="center", va="center", fontsize=7.5, zorder=4)


def dec(a, x, y, t, w=26, h=12):
    a.add_patch(Polygon([(x, y + h / 2), (x + w / 2, y), (x, y - h / 2), (x - w / 2, y)], fc="#fff4d6", ec="#8a6d00", lw=1.3, zorder=2))
    a.text(x, y, t, ha="center", va="center", fontsize=7.5, zorder=4)


def proc(a, x, y, t, r=7):
    a.add_patch(Ellipse((x, y), r * 2.3, r * 1.5, fc="#fff4d6", ec="#8a6d00", lw=1.5, zorder=2))
    a.text(x, y, t, ha="center", va="center", fontsize=8, zorder=4)


def ent(a, x, y, t, w=16, h=7):
    a.add_patch(Rectangle((x - w / 2, y - h / 2), w, h, fc="#e8eef7", ec=NAVY, lw=1.5, zorder=2))
    a.text(x, y, t, ha="center", va="center", fontsize=9, fontweight="bold", zorder=4)


def store(a, x, y, t, w=22, h=4.5):
    a.add_patch(Rectangle((x - w / 2, y - h / 2), w, h, fc="#e6f4ea", ec="none", zorder=1))
    a.plot([x - w / 2, x + w / 2], [y + h / 2] * 2, color="#2e7d32", lw=1.5)
    a.plot([x - w / 2, x + w / 2], [y - h / 2] * 2, color="#2e7d32", lw=1.5)
    a.text(x, y, t, ha="center", va="center", fontsize=8, zorder=4)


def box(a, x, y, w, h, t, fc="#e8eef7", fs=8, bold=False):
    a.add_patch(FancyBboxPatch((x - w / 2, y - h / 2), w, h, boxstyle="round,pad=0.2", fc=fc, ec=NAVY, lw=1.4, zorder=2))
    a.text(x, y, t, ha="center", va="center", fontsize=fs, fontweight="bold" if bold else "normal", zorder=4)


# ---------------------------------------------------------------- Gantt chart
f, a = plt.subplots(figsize=(11, 5.2))
tasks = [("Project identification and feasibility", 1, 2, "#1f3a5f"), ("Requirement analysis", 2, 2, "#1f3a5f"),
         ("Design", 3, 2, "#1f3a5f"), ("Back end: login, training, quizzes", 4, 4, "#2e7d32"),
         ("Back end: phishing, incidents, audit", 7, 5, "#2e7d32"), ("Web front end", 6, 7, "#2e7d32"),
         ("Testing and fixes", 10, 4, "#c77700"),
         ("Documentation and presentation", 13, 2, "#8a1f1f")]
for i, (n, s, d, c) in enumerate(tasks):
    a.barh(len(tasks) - 1 - i, d, left=s - 1, color=c, height=0.55)
a.set_yticks(range(len(tasks)))
a.set_yticklabels([t[0] for t in tasks][::-1], fontsize=8)
a.set_xticks(range(0, 15))
a.set_xticklabels([str(i) for i in range(1, 16)], fontsize=8)
a.set_xlabel("Week", fontsize=9)
a.set_xlim(0, 15)
a.grid(axis="x", alpha=0.3)
for sp in ("top", "right"):
    a.spines[sp].set_visible(False)
save(f, "gantt.png", "Figure: Project schedule (Gantt chart)")

# ---------------------------------------------------------------- login flowchart
f, a = fig(10, 9)
term(a, 40, 86, "Start")
step(a, 40, 76, "User enters e-mail and password")
step(a, 40, 66, "Send request to /auth/login/")
dec(a, 40, 54, "Request\nwithin limit?")
dec(a, 40, 40, "Account active\nand password right?")
step(a, 40, 27, "Create session; issue access and\nrefresh tokens; reset failed counter", w=30, h=8)
term(a, 40, 15, "Show dashboard", w=22)
step(a, 78, 54, "Show 'too many requests'", w=24)
step(a, 78, 40, "Add 1 to failed attempts;\nshow error", w=24, h=8)
term(a, 78, 27, "Back to login", w=20)
for p, q in [((40, 83), (40, 79.5)), ((40, 72.5), (40, 69.5)), ((40, 62.5), (40, 60)), ((40, 48), (40, 46)), ((40, 34), (40, 31)), ((40, 23), (40, 18))]:
    arr(a, p, q)
arr(a, (53, 54), (66, 54), "No", off=(0, 2)); arr(a, (53, 40), (66, 40), "No", off=(0, 2))
elbow(a, [(90, 54), (98, 54), (98, 27), (88.4, 27)]); arr(a, (78, 36), (78, 30))
a.text(42.5, 44.5, "Yes", fontsize=7); a.text(42.5, 33, "Yes", fontsize=7)
save(f, "flowchart_login.png", "Figure: Flowchart of the login process")

# ---------------------------------------------------------------- activity: report incident
f, a = fig(12, 10)
a.add_patch(Rectangle((2, 3), 36, 90, fc="none", ec="#999", lw=1)); a.text(20, 95, "Reporter", ha="center", fontsize=9, fontweight="bold")
a.add_patch(Rectangle((40, 3), 38, 90, fc="none", ec="#999", lw=1)); a.text(59, 95, "System", ha="center", fontsize=9, fontweight="bold")
a.add_patch(Rectangle((80, 3), 38, 90, fc="none", ec="#999", lw=1)); a.text(99, 95, "Administrator", ha="center", fontsize=9, fontweight="bold")
term(a, 20, 88, "Start", w=14)
step(a, 20, 78, "Fill in incident form", w=26)
step(a, 20, 68, "Attach evidence files", w=26)
dec(a, 20, 56, "Save draft\nor submit?", w=24)
step(a, 59, 56, "Check files: type\nand size (10 MB)", w=26, h=8)
dec(a, 59, 44, "Valid?", w=20, h=10)
step(a, 59, 32, "Create incident: reference,\npriority, first timeline entry", w=30, h=8)
step(a, 20, 32, "See reference number", w=26)
step(a, 99, 32, "See incident in SOC queue", w=30)
step(a, 99, 20, "Assign; change status;\nadd timeline notes", w=32, h=8)
dec(a, 99, 8, "Resolved?", w=20, h=9)
term(a, 59, 8, "Write audit log", w=22, h=5)
arr(a, (20, 85), (20, 81.5)); arr(a, (20, 74.5), (20, 71.5)); arr(a, (20, 64.5), (20, 62))
arr(a, (32, 56), (46, 56), "Submit", off=(0, 2)); arr(a, (59, 52), (59, 49)); arr(a, (59, 39), (59, 36))
arr(a, (49, 44), (28, 70), "No: show error", off=(-5, 6), rad=-0.2, ls=":")
arr(a, (46, 32), (33, 32)); arr(a, (74, 32), (84, 32)); arr(a, (99, 28.5), (99, 24)); arr(a, (99, 16), (99, 12.5))
arr(a, (89, 8), (70, 8), "Yes: close", off=(0, 2))
arr(a, (110, 8), (110, 20), "No: keep working", off=(-1, 0), ls=":"); arr(a, (110, 20), (115.5, 20), ls=":", style="-")
a.text(62, 38.5, "Yes", fontsize=7)
term(a, 20, 40, "Draft saved", w=16, h=5); arr(a, (20, 50), (20, 42.8), "Draft", off=(5, 0))
save(f, "activity_incident.png", "Figure: Activity diagram, reporting and handling an incident")

# ---------------------------------------------------------------- activity: quiz
f, a = fig(10, 9)
term(a, 40, 86, "Start")
step(a, 40, 76, "Choose a quiz")
dec(a, 40, 64, "Attempts left?", w=26)
step(a, 40, 51, "Start attempt; timer begins")
step(a, 40, 41, "Answer questions")
dec(a, 40, 29, "Submit or\ntime ends?", w=26)
step(a, 40, 17, "Server grades answers; saves attempt;\nfinds weak topics", w=34, h=8)
term(a, 40, 6, "Show score, answers and lesson tips", w=34)
step(a, 80, 64, "Show 'no attempts left'", w=26)
term(a, 80, 52, "End", w=14)
for p, q in [((40, 83), (40, 79.5)), ((40, 72.5), (40, 70)), ((40, 58), (40, 54.5)), ((40, 47.5), (40, 44.5)), ((40, 37.5), (40, 35)), ((40, 23), (40, 21)), ((40, 13), (40, 9))]:
    arr(a, p, q)
arr(a, (53, 64), (67, 64), "No", off=(0, 2)); arr(a, (80, 60.5), (80, 55)); a.text(42.5, 59, "Yes", fontsize=7)
elbow(a, [(27, 29), (14, 29), (14, 41), (28, 41)], ls=":"); a.text(13, 35, "No: keep answering", fontsize=7, ha="right", va="center")
save(f, "activity_quiz.png", "Figure: Activity diagram, taking a quiz")

# ---------------------------------------------------------------- extra level 2 DFDs
def dfd2(name, title, entity_in, procs, stores_, flows, w=12, h=5):
    f, a = fig(w, h)
    ent(a, 8, h * 5, entity_in)
    for x, y, t in procs:
        proc(a, x, y, t, r=8)
    for x, y, t in stores_:
        store(a, x, y, t)
    for fl in flows:
        arr(a, fl[0], fl[1], fl[2], off=fl[3] if len(fl) > 3 else (0, 3))
    save(f, name, title)


dfd2("dfd_level2_auth.png", "Figure: Level 2 DFD, process 1.0 Authenticate and manage users", "User",
     [(32, 32, "1.1\nRegister"), (56, 32, "1.2\nLogin and\nissue tokens"), (80, 32, "1.3\nManage\nsessions"), (104, 32, "1.4\nManage users\nand roles")],
     [(44, 8, "D1 Users / Roles"), (92, 8, "D1b Sessions / Login attempts")],
     [((16, 32), (24, 32), "details"), ((40, 32), (48, 32), "account"), ((64, 32), (72, 32), "tokens"), ((88, 32), (96, 32), "role change"),
      ((32, 24.5), (40, 10.5), "new user", (-6, 0)), ((56, 24.5), (48, 10.5), "check / log", (6, 0)), ((80, 24.5), (88, 10.5), "revoke", (-6, 0)),
      ((104, 24.5), (100, 10.5), "update", (6, 0))])
dfd2("dfd_level2_training.png", "Figure: Level 2 DFD, process 2.0 Deliver training", "Normal User",
     [(32, 32, "2.1\nBrowse and\nsearch lessons"), (56, 32, "2.2\nRead lesson"), (80, 32, "2.3\nTrack progress\nand bookmarks"), (104, 32, "2.4\nRecommend\nlessons")],
     [(44, 8, "D2 Lessons / Categories"), (92, 8, "D2b Progress / Bookmarks")],
     [((16, 32), (24, 32), "filters"), ((40, 32), (48, 32), "choice"), ((64, 32), (72, 32), "percent"), ((88, 32), (96, 32), "history"),
      ((32, 24.5), (40, 10.5), "query", (-6, 0)), ((56, 24.5), (48, 10.5), "content", (6, 0)), ((80, 24.5), (88, 10.5), "save", (-6, 0)),
      ((104, 24.5), (100, 10.5), "read", (6, 0))])
dfd2("dfd_level2_phishing.png", "Figure: Level 2 DFD, process 4.0 Phishing simulation", "Normal User",
     [(32, 32, "4.1\nShow\nscenario"), (56, 32, "4.2\nInspect\nlinks"), (80, 32, "4.3\nScore\nclassification"), (104, 32, "4.4\nGive feedback\nand tip")],
     [(44, 8, "D4 Simulations"), (92, 8, "D4b Attempts")],
     [((16, 32), (24, 32), "request"), ((40, 32), (48, 32), "message"), ((64, 32), (72, 32), "choice + flags"), ((88, 32), (96, 32), "score"),
      ((32, 24.5), (40, 10.5), "read", (-6, 0)), ((80, 24.5), (88, 10.5), "save", (-6, 0)), ((104, 24.5), (100, 10.5), "read tip", (6, 0))])
# ---------------------------------------------------------------- deployment diagram
f, a = fig(11, 6)
box(a, 14, 30, 22, 30, "User computer\n\nWeb browser\n(React app)", fc="#fff4d6", fs=8.5)
box(a, 52, 30, 28, 40, "Application server\n\nWeb server (HTTPS)\nDjango + REST API\nJWT, RBAC, audit\nmedia/ evidence files", fc="#e6f4ea", fs=8.5)
box(a, 92, 40, 26, 16, "Database server\n\nSQLite (development)\nMySQL 8 (production)", fc="#f3e5f5", fs=8.5)
box(a, 52, 3, 28, 5, "SMTP service (reset / verify e-mails)", fc="#eeeeee", fs=7.5)
arr(a, (25, 30), (38, 30), "HTTPS / JSON", off=(0, 3))
arr(a, (66, 36), (79, 40), "SQL", off=(0, 3))
arr(a, (52, 10), (52, 5.8), "")
save(f, "deployment.png", "Figure: Deployment diagram")

# ---------------------------------------------------------------- module structure chart
f, a = fig(12, 7)
box(a, 60, 62, 26, 7, "CyberShield Hub", fc="#fff4d6", bold=True, fs=9)
mods = [("Accounts", ["Register", "Login / logout", "Password reset", "Roles and users"]), ("Training", ["Categories", "Lessons", "Progress", "Bookmarks"]),
        ("Quizzes", ["Quiz authoring", "Attempts", "Grading", "Weak topics"]), ("Phishing lab", ["Scenarios", "Classify", "Score", "Feedback"]),
        ("Incidents", ["Report", "Evidence", "Queue / assign", "Timeline"]),
        ("Analytics and audit", ["Dashboards", "Org reports", "Audit log", "CSV export"])]
xs = [12, 28, 44, 60, 76, 92, 108]
for x, (m, subs) in zip(xs, mods):
    box(a, x, 48, 14.5, 6, m, fs=7.5, bold=True)
    arr(a, (60, 58.3), (x, 51.3), style="-")
    for i, s in enumerate(subs):
        box(a, x, 38 - i * 8, 14.5, 5.2, s, fc="#ffffff", fs=7)
    arr(a, (x, 45), (x, 40.8), style="-")
save(f, "structure_chart.png", "Figure: System module structure chart")
print("extra diagrams done")


# ---------------------------------------------------------------- redrawn core diagrams
def flow(a, p, q, label, gap=3.0, lab=5.5, fs=7):
    """Arrow shifted sideways by `gap` so two opposite flows do not overlap; label sits beside the line."""
    import math
    dx, dy = q[0] - p[0], q[1] - p[1]
    n = math.hypot(dx, dy)
    nx, ny = -dy / n, dx / n
    p2 = (p[0] + nx * gap, p[1] + ny * gap)
    q2 = (q[0] + nx * gap, q[1] + ny * gap)
    arr(a, p2, q2)
    mx, my = (p2[0] + q2[0]) / 2 + nx * lab, (p2[1] + q2[1]) / 2 + ny * lab
    a.text(mx, my, label, ha="center", va="center", fontsize=fs, bbox=dict(fc="white", ec="none", pad=0.5), zorder=5)


# architecture
f, a = fig(11, 6)
box(a, 12, 38, 20, 14, "Users and\nadministrators", fc="#fff4d6", fs=8.5)
box(a, 44, 38, 26, 22, "Web app\n\nReact + Vite\nruns in the browser", fs=8.5)
box(a, 88, 38, 36, 30, "Django REST API  (/api/v1)\n\nJWT login and role checks\nBusiness rules (services)\nAudit middleware\nApps: users, training, quizzes,\nphishing, incidents,\nanalytics, audit", fc="#e6f4ea", fs=8.5)
box(a, 100, 8, 32, 8, "Database: SQLite (development)\nor MySQL 8 (production)", fc="#f3e5f5", fs=7.5)
box(a, 56, 8, 34, 8, "Evidence file storage (media/)", fc="#f3e5f5", fs=8)
arr(a, (22, 38), (31, 38))
arr(a, (57, 38), (70, 38), "HTTPS + Bearer token", off=(0, 3))
arr(a, (100, 23), (100, 12.5), "read / write", off=(8, 0))
arr(a, (78, 23), (66, 12.5), "save files", off=(-1, 3))
save(f, "architecture.png", "")

# level 0 DFD
f, a = fig(11, 5)
proc(a, 62, 25, "0\nCyberShield Hub\nplatform", r=11)
ent(a, 14, 40, "Normal user", w=20, h=8)
ent(a, 100, 25, "System\nadministrator", w=20, h=8)
flow(a, (24, 41), (55, 31), "registration, login, quiz answers,\nincident reports, classifications", gap=2.5, lab=5.5)
flow(a, (55, 31), (24, 41), "lessons, scores,\nfeedback", gap=2.5, lab=5.5)
flow(a, (90, 25), (74, 25), "user, role and content management,\nincident handling", gap=2.5, lab=6)
flow(a, (74, 25), (90, 25), "user lists, incident queue,\nanalytics, audit reports", gap=2.5, lab=6)
save(f, "dfd_level0.png", "")

# level 1 DFD
f, a = fig(12, 8)
ent(a, 10, 70, "Normal user", w=16, h=7)
ent(a, 10, 14, "Administrator", w=16, h=7)
P = [(40, 72, "1.0\nAuthenticate\nand manage users"), (68, 72, "2.0\nDeliver\ntraining"), (96, 72, "3.0\nRun\nquizzes"),
     (40, 40, "4.0\nPhishing\nsimulation"), (68, 40, "5.0\nIncident\nresponse")]
for x, y, t in P:
    proc(a, x, y, t, r=8)
S = [(40, 56, "D1 Users / Roles"), (68, 56, "D2 Lessons / Progress"), (96, 56, "D3 Quizzes / Attempts"),
     (40, 24, "D4 Phishing"), (68, 24, "D5 Incidents")]
for x, y, t in S:
    store(a, x, y, t)
for (x, y, _), (sx, sy, _) in zip(P, S):
    arr(a, (x, y - 7), (sx, sy + 2.3))
arr(a, (18, 71), (31, 72), "credentials, requests", off=(0, 3))
arr(a, (14, 66), (34, 44), "answers, reports,\nclassifications", off=(-1, 5), ls=":")
arr(a, (18, 14), (60, 36), "assignment,\nstatus", off=(-20, 8), ls=":")
proc(a, 68, 8, "7.0 Analytics\nand audit", r=8)
store(a, 108, 8, "D7 Audit log", w=14)
arr(a, (76, 8), (101, 8), "request log", off=(0, 2))
arr(a, (18, 12), (60, 8), "filters, exports", off=(0, -2.5))
save(f, "dfd_level1.png", "")

# level 2 DFD: incident response
f, a = fig(12, 6)
ent(a, 8, 45, "Reporter", w=14, h=7)
ent(a, 8, 10, "Administrator", w=14, h=7)
P = [(32, 45, "5.1\nCapture\nreport"), (56, 45, "5.2\nValidate\nevidence"), (80, 45, "5.3\nPrioritise and\nreference"),
     (56, 10, "5.4\nAssign"), (84, 10, "5.5\nUpdate status\nand timeline")]
for x, y, t in P:
    proc(a, x, y, t, r=8)
store(a, 80, 27, "D5 Incidents")
store(a, 56, 27, "D5a Attachments")
store(a, 108, 27, "D5b Updates / Assignments")
arr(a, (15, 45), (23, 45), "report details", off=(0, 3))
arr(a, (41, 45), (48, 45), "files")
arr(a, (65, 45), (72, 45), "valid report")
arr(a, (80, 37), (80, 29.5), "reference, score", off=(9, 0))
arr(a, (56, 37), (56, 29.5))
arr(a, (15, 10), (48, 10), "assignee choice", off=(0, 2.5))
arr(a, (65, 10), (75, 10), "assignment")
arr(a, (93, 14), (108, 25), "timeline entry", off=(-2, 0))
arr(a, (80, 24.5), (84, 17), "status", off=(7, 0))
arr(a, (24, 38), (15, 15), "status feedback", off=(2, 0), ls=":")
save(f, "dfd_level2_incident.png", "")

# use case diagram
f, a = fig(12, 8)
a.add_patch(Rectangle((32, 3), 62, 72, fc="none", ec=NAVY, lw=1.5))
a.text(63, 77, "CyberShield Hub", ha="center", fontsize=10, fontweight="bold")
ent(a, 12, 50, "Normal user", w=18, h=7)
ent(a, 109, 36, "System administrator", w=22, h=8)
UC = {"reg": (48, 68, "Register / log in"), "les": (48, 58, "Study lessons"), "quiz": (48, 48, "Take quiz"), "ph": (48, 38, "Run phishing simulation"),
      "rep": (48, 28, "Report incident"),
      "soc": (79, 68, "Manage SOC queue"), "asg": (79, 58, "Assign and update incidents"), "ana": (79, 48, "View organisation analytics"),
      "aud": (79, 38, "Review audit log"), "adm": (79, 28, "Manage users, roles, content")}
for k, (x, y, t) in UC.items():
    a.add_patch(Ellipse((x, y), 27, 7, fc="#fff4d6", ec="#8a6d00", zorder=2))
    a.text(x, y, t, ha="center", va="center", fontsize=7.5, zorder=4)
for k in ["reg", "les", "quiz", "ph", "rep"]:
    arr(a, (21, 50), (UC[k][0] - 13.5, UC[k][1]), style="-")
for k in UC:
    arr(a, (98, 36), (UC[k][0] + 13.5, UC[k][1]), style="-")
a.text(4, 7, "Administrators can also do everything a normal user can do.", fontsize=6.5, ha="left", va="center")
save(f, "use_case.png", "")

# sequence diagram
f, a = fig(12, 7)
names = ["Reporter", "Web app", "Django API", "Database", "Administrator"]
xs = [10, 35, 60, 85, 110]
for x, n in zip(xs, names):
    box(a, x, 62, 18, 5, n, bold=True)
    a.plot([x, x], [3, 58], color="#888", ls="--", lw=1)
steps = [(0, 1, 54, "1 fill incident form + evidence"), (1, 2, 48, "2 POST /incidents/incidents/ (Bearer token)"),
         (2, 3, 42, "3 check token, role, file type and size; save"), (3, 2, 36, "4 saved incident (INC-date-xxxxxx)"),
         (2, 1, 30, "5 201 Created + reference number"), (1, 0, 24, "6 show confirmation"),
         (4, 2, 18, "7 POST /assign/ then /transition/"), (2, 3, 12, "8 write assignment, timeline, audit log"),
         (2, 1, 6, "9 new status shown to the reporter")]
for s_, t_, y, l in steps:
    arr(a, (xs[s_], y), (xs[t_], y), l, off=(0, 2), fs=7)
save(f, "sequence_incident.png", "")
print("core redraws done")


# ---------------------------------------------------------------- entity relationship diagram
ARRZ = 0
f, a = fig(12, 8)
T = {}


def tb(k, x, y, n, cols, w=22):
    h = 4 + 2.8 * len(cols)
    a.add_patch(Rectangle((x - w / 2, y - h / 2), w, h, fc="white", ec=NAVY, lw=1.3, zorder=2))
    a.add_patch(Rectangle((x - w / 2, y + h / 2 - 3.5), w, 3.5, fc=NAVY, zorder=3))
    a.text(x, y + h / 2 - 1.8, n, color="white", ha="center", va="center", fontsize=7.5, fontweight="bold", zorder=4)
    for i, c in enumerate(cols):
        a.text(x - w / 2 + 1, y + h / 2 - 5.5 - 2.8 * i, c, fontsize=6.5, va="center", zorder=4)
    T[k] = (x, y)


tb("roles", 12, 70, "roles", ["PK id", "code UNIQUE", "name", "permissions"])
tb("users", 12, 44, "users", ["PK id", "email UNIQUE", "FK role_id", "security_score", "is_deactivated"])
tb("lc", 42, 71, "lesson_categories", ["PK id", "name, slug", "order"])
tb("lessons", 42, 52, "lessons", ["PK id", "FK category_id", "FK created_by_id", "slug, difficulty"])
tb("lp", 42, 29, "lesson_progress / bookmarks", ["PK id", "FK user_id", "FK lesson_id", "percent, completed"], w=26)
tb("quizzes", 74, 71, "quizzes", ["PK id", "FK lesson_id", "FK category_id", "pass_score, max_attempts"])
tb("q", 74, 52, "questions / answers", ["PK id", "FK quiz_id", "is_correct", "points"])
tb("qa", 74, 29, "quiz_attempts", ["PK id", "FK user_id", "FK quiz_id", "score, passed"])
tb("ph", 106, 71, "phishing_simulations", ["PK id", "FK created_by_id", "is_phishing", "red_flags JSON"], w=24)
tb("pa", 106, 50, "phishing_attempts", ["PK id", "FK user_id", "FK simulation_id", "score"], w=24)
tb("inc", 30, 10, "incidents", ["PK id", "reference_number UNIQUE", "FK category_id", "FK reporter_id, assigned_to_id", "severity, status"], w=32)
tb("iu", 72, 10, "incident_updates / assignments / attachments", ["PK id", "FK incident_id", "FK actor_id"], w=38)
tb("au", 106, 28, "audit_logs", ["PK id", "FK actor_id", "action, path"])
for k1, k2 in [("users", "roles"), ("lessons", "lc"), ("lp", "lessons"), ("lp", "users"), ("q", "quizzes"), ("qa", "quizzes"),
               ("qa", "users"), ("pa", "ph"), ("pa", "users"), ("inc", "users"), ("iu", "inc"), ("au", "users"),
               ("quizzes", "lessons")]:
    arr(a, T[k1], T[k2], style="-")
save(f, "erd.png", "")
print("erd done")
