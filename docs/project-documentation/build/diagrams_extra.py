"""Extra diagrams for the project documentation (Gantt, flowcharts, activity, extra level 2 DFDs,
deployment and module structure). Run: python diagrams_extra.py"""
import os
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyBboxPatch, Ellipse, Rectangle, FancyArrowPatch, Polygon

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "diagrams") + os.sep
NAVY = "#1f3a5f"


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
                                connectionstyle=f"arc3,rad={rad}", linestyle=ls, zorder=3))
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
         ("Back end: phishing, incidents, alerts, audit", 7, 5, "#2e7d32"), ("Web front end", 6, 7, "#2e7d32"),
         ("Mobile application", 11, 3, "#2e7d32"), ("Testing and fixes", 10, 4, "#c77700"),
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
a.add_patch(Rectangle((80, 3), 38, 90, fc="none", ec="#999", lw=1)); a.text(99, 95, "Officer", ha="center", fontsize=9, fontweight="bold")
term(a, 20, 88, "Start", w=14)
step(a, 20, 78, "Fill in incident form", w=26)
step(a, 20, 68, "Attach evidence files", w=26)
dec(a, 20, 56, "Save draft\nor submit?", w=24)
step(a, 59, 56, "Check files: type\nand size (10 MB)", w=26, h=8)
dec(a, 59, 44, "Valid?", w=20, h=10)
step(a, 59, 32, "Create incident: reference,\npriority, first timeline entry", w=30, h=8)
step(a, 20, 32, "See reference number", w=26)
step(a, 99, 32, "See incident in SOC queue", w=30)
step(a, 99, 20, "Assign officer; change status;\nadd timeline notes", w=32, h=8)
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
dfd2("dfd_level2_alerts.png", "Figure: Level 2 DFD, process 6.0 Alerts and notifications", "Administrator",
     [(32, 32, "6.1\nPublish\nalert"), (56, 32, "6.2\nSend to\naudience"), (80, 32, "6.3\nShow\nnotifications"), (104, 32, "6.4\nMark as\nread")],
     [(44, 8, "D6 Alerts"), (92, 8, "D6b Notifications")],
     [((16, 32), (24, 32), "alert text"), ((40, 32), (48, 32), "alert"), ((64, 32), (72, 32), "list"), ((88, 32), (96, 32), "read action"),
      ((32, 24.5), (40, 10.5), "save", (-6, 0)), ((56, 24.5), (88, 10.5), "one per user", (0, 3)), ((104, 24.5), (100, 10.5), "update", (6, 0))])

# ---------------------------------------------------------------- deployment diagram
f, a = fig(11, 6)
box(a, 14, 30, 22, 30, "User devices\n\nWeb browser\n(React app)\n\nAndroid phone\n(Flutter app)", fc="#fff4d6", fs=8.5)
box(a, 52, 30, 28, 40, "Application server\n\nWeb server (HTTPS)\nDjango + REST API\nJWT, RBAC, audit\nWhiteNoise static files\nmedia/ evidence files", fc="#e6f4ea", fs=8.5)
box(a, 92, 40, 26, 16, "Database server\n\nSQLite (development)\nMySQL 8 (production)", fc="#f3e5f5", fs=8.5)
box(a, 92, 14, 26, 14, "Backup storage\n\nDaily database dump\nmedia copy", fc="#eeeeee", fs=8.5)
box(a, 52, 3, 28, 5, "SMTP service (reset / verify e-mails)", fc="#eeeeee", fs=7.5)
arr(a, (25, 30), (38, 30), "HTTPS / JSON", off=(0, 3))
arr(a, (66, 36), (79, 40), "SQL", off=(0, 3))
arr(a, (66, 24), (79, 16), "backup", off=(0, -3))
arr(a, (52, 10), (52, 5.8), "")
save(f, "deployment.png", "Figure: Deployment diagram")

# ---------------------------------------------------------------- module structure chart
f, a = fig(12, 7)
box(a, 60, 62, 26, 7, "CyberShield Hub", fc="#fff4d6", bold=True, fs=9)
mods = [("Accounts", ["Register", "Login / logout", "Password reset", "Roles and users"]), ("Training", ["Categories", "Lessons", "Progress", "Bookmarks"]),
        ("Quizzes", ["Quiz authoring", "Attempts", "Grading", "Weak topics"]), ("Phishing lab", ["Scenarios", "Classify", "Score", "Feedback"]),
        ("Incidents", ["Report", "Evidence", "Queue / assign", "Timeline"]), ("Alerts", ["Publish", "Notify", "Mark read"]),
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
box(a, 12, 38, 20, 14, "Users, officers\nand administrators", fc="#fff4d6", fs=8.5)
box(a, 44, 38, 26, 22, "Clients\n\nReact + Vite web app\nFlutter mobile app", fs=8.5)
box(a, 88, 38, 36, 30, "Django REST API  (/api/v1)\n\nJWT login and role checks\nBusiness rules (services)\nAudit middleware\nApps: users, training, quizzes,\nphishing, incidents, alerts,\nanalytics, audit", fc="#e6f4ea", fs=8.5)
box(a, 100, 8, 32, 8, "Database: SQLite (development)\nor MySQL 8 (production)", fc="#f3e5f5", fs=7.5)
box(a, 56, 8, 34, 8, "Evidence file storage (media/)", fc="#f3e5f5", fs=8)
arr(a, (22, 38), (31, 38))
arr(a, (57, 38), (70, 38), "HTTPS + Bearer token", off=(0, 3))
arr(a, (100, 23), (100, 12.5), "read / write", off=(8, 0))
arr(a, (78, 23), (66, 12.5), "save files", off=(-1, 3))
save(f, "architecture.png", "")

# level 0 DFD
f, a = fig(11, 6)
proc(a, 62, 30, "0\nCyberShield Hub\nplatform", r=11)
ent(a, 14, 50, "Normal user", w=20, h=8)
ent(a, 14, 8, "Cybersecurity\nofficer", w=20, h=8)
ent(a, 100, 30, "System\nadministrator", w=20, h=8)
flow(a, (24, 51), (55, 37), "registration, login, quiz answers,\nincident reports, classifications", gap=2.5, lab=5.5)
flow(a, (55, 37), (24, 51), "lessons, scores, feedback,\nalerts", gap=2.5, lab=5.5)
flow(a, (24, 7), (55, 23), "status changes, assignments,\nalert publications", gap=2.5, lab=5.5)
flow(a, (55, 23), (24, 7), "incident queue, analytics,\naudit reports", gap=2.5, lab=5.5)
flow(a, (90, 30), (74, 30), "user, role and content\nmanagement", gap=2.5, lab=6)
flow(a, (74, 30), (90, 30), "user lists, logs,\nreports", gap=2.5, lab=6)
save(f, "dfd_level0.png", "")

# use case diagram (administrators publish alerts; officers handle incidents)
f, a = fig(12, 8)
a.add_patch(Rectangle((32, 3), 62, 72, fc="none", ec=NAVY, lw=1.5))
a.text(63, 77, "CyberShield Hub", ha="center", fontsize=10, fontweight="bold")
ent(a, 12, 52, "Normal user", w=18, h=7)
ent(a, 12, 16, "Cybersecurity officer", w=18, h=8)
ent(a, 109, 30, "System administrator", w=22, h=8)
UC = {"reg": (48, 68, "Register / log in"), "les": (48, 58, "Study lessons"), "quiz": (48, 48, "Take quiz"), "ph": (48, 38, "Run phishing simulation"),
      "rep": (48, 28, "Report incident"), "al": (48, 18, "Read alerts"),
      "soc": (79, 68, "Manage SOC queue"), "asg": (79, 58, "Assign and update incidents"), "ana": (79, 48, "View organisation analytics"),
      "aud": (79, 38, "Review audit log"), "pub": (79, 28, "Publish alerts"), "adm": (79, 18, "Manage users, roles, content")}
for k, (x, y, t) in UC.items():
    a.add_patch(Ellipse((x, y), 27, 7, fc="#fff4d6", ec="#8a6d00", zorder=2))
    a.text(x, y, t, ha="center", va="center", fontsize=7.5, zorder=4)
for k in ["reg", "les", "quiz", "ph", "rep", "al"]:
    arr(a, (21, 52), (UC[k][0] - 13.5, UC[k][1]), style="-")
for k in ["soc", "asg", "ana", "aud"]:
    arr(a, (21, 17), (UC[k][0] - 13.5, UC[k][1]), style="-")
for k in ["pub", "adm", "aud", "ana", "soc", "asg"]:
    arr(a, (98, 30), (UC[k][0] + 13.5, UC[k][1]), style="-")
a.text(4, 7, "Officers can also do everything a normal user can do. Administrators can also do everything an officer can do.", fontsize=6.5, ha="left", va="center")
save(f, "use_case.png", "")
print("core redraws done")
