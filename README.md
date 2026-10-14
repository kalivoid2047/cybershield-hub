# CyberShield Hub

CyberShield Hub is an enterprise cybersecurity awareness and incident response platform. It combines a training workspace, quiz engine, phishing simulator, incident intake and SOC-style response queue, analytics, role-based access control, and an audit trail — all behind a single JWT-secured REST API with a React single-page app on top.

## Stack

- **Backend:** Python 3.12, Django 5, Django REST Framework, Simple JWT, django-filter, drf-spectacular, WhiteNoise
- **Database:** SQLite by default (zero setup); MySQL 8 supported via `DB_ENGINE=mysql`
- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Chart.js, Axios, React Router

## What It Does

| Module | Description |
| --- | --- |
| Authentication & RBAC | Registration, JWT login/logout with refresh rotation and blacklist, password reset and email verification tokens, login attempt tracking, session revocation. Two roles: normal user and system administrator. |
| Dashboard | Per-user security score, learning progress, quiz and phishing performance and incidents. |
| Training | Categorized lessons with rich content, difficulty levels, tags, progress tracking, completion, bookmarks, search/filtering, and role-aware recommendations. |
| Quizzes | Timed multiple-choice assessments with scoring, pass/fail, attempt history, per-competency weakness analysis, and recommendations. |
| Phishing simulator | Realistic inbox scenarios the user classifies as safe or suspicious, with URL inspection, red-flag selection, and scored feedback. |
| Incident reporting | Incident submission with evidence uploads (allow-listed file types, size limits), drafts, auto-generated reference numbers, and status tracking. |
| SOC management | Admin-facing incident queue (Kanban), assignment, escalation, status workflow with timeline entries, and severity/status heatmap data. |
| Analytics | User dashboard metrics plus organization-wide training, quiz, phishing, incident, and risk-score reporting for admins. |
| Audit log | Immutable-style log of every mutating API request, with filtering, search, and CSV export. |

## Project Structure

```text
backend/
  config/                 Django settings, API routing, ASGI/WSGI
  apps/
    common/               shared permissions, pagination, responses, validators, middleware
    users/                JWT auth, roles, users, sessions, login attempts
    training/             lessons, categories, progress, bookmarks
    quizzes/              quiz engine, answers, attempts, scoring
    phishing/             phishing simulations and attempt scoring
    incidents/            incident intake, evidence, queue, assignment, timeline
    analytics/            user and organization reporting APIs
    audit/                audit log middleware, API, and CSV export
frontend/
  src/
    pages/                screens for every module
    components/           cards, charts, badges, kanban, layout primitives
    services/             Axios API wrappers (with dev-only fallback data)
    api/                  Axios client with JWT interceptors
mobile/                   Flutter app for learners and incident reporters (see mobile/README.md)
docs/                     architecture diagrams, API map, MySQL schema reference
```

## Running Locally

Prerequisites: **Python 3.12+** and **Node.js 20+**.

### 1. Backend (Django API)

From the project root:

```bash
cp .env.example .env          # defaults work out of the box (SQLite, debug on)

cd backend
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo    # optional: demo accounts + sample content
python manage.py runserver
```

The API is now at `http://127.0.0.1:8000`:

- Health check: `http://127.0.0.1:8000/health/`
- Swagger API docs: `http://127.0.0.1:8000/api/v1/docs/`
- Django admin: `http://127.0.0.1:8000/admin/`

### 2. Frontend (React SPA)

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` requests to the Django backend on port 8000, so no extra configuration is needed.

### Demo accounts

Created by `python manage.py seed_demo`:

| Account | Password | Role |
| --- | --- | --- |
| `admin@cybershield.local` | `CyberShield123!` | System administrator |
| `user@cybershield.local` | `CyberShield123!` | Normal user |

### Using MySQL instead of SQLite

1. Create a MySQL 8 database and user.
2. In `.env`, set `DB_ENGINE=mysql` and fill in `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`.
3. Uncomment `mysqlclient` in `backend/requirements.txt` and `pip install mysqlclient`.
4. Re-run `python manage.py migrate` (and `seed_demo` if desired).

A full schema reference lives in [docs/database_schema.sql](docs/database_schema.sql).

## API Overview

All endpoints are rooted at `/api/v1/` and documented interactively at `/api/v1/docs/`. Highlights:

- `POST /auth/register/`, `POST /auth/login/`, `POST /auth/logout/`, `GET|PATCH /auth/me/`
- `GET /training/lessons/`, `GET /training/lessons/{slug}/`, `POST /training/lessons/{slug}/progress/`, `POST|DELETE /training/lessons/{slug}/bookmark/`
- `POST /quizzes/quizzes/{id}/start/`, `POST /quizzes/quizzes/{id}/submit/`
- `POST /phishing/simulations/{id}/submit/`
- `POST /incidents/incidents/`, `GET /incidents/incidents/queue/`, `POST /incidents/incidents/{id}/assign/`, `POST /incidents/incidents/{id}/transition/`
- `GET /analytics/me/`, `GET /analytics/organization/`, `GET /analytics/charts/`
- `GET /audit/logs/`, `GET /audit/logs/export/`

The complete endpoint map is in [docs/api_endpoints.md](docs/api_endpoints.md).

## Running Tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest                                       # run the full suite
pytest --cov=apps --cov-report=term-missing  # with coverage
```

The pytest suite covers auth/RBAC, training progress, quiz and phishing grading, incident workflow (assignment/transition/queue), audit logging, and analytics, across `backend/apps/*/tests/`.

## Security Posture

- JWT access/refresh tokens with refresh rotation and blacklist support.
- Role-based permissions enforced per viewset and per action.
- DRF throttling for anonymous, authenticated, and auth-sensitive endpoints.
- CSRF middleware, strict security headers, HSTS-ready production flags.
- ORM-only database access; evidence upload allow-list and size validation.
- Standardized API error responses; every mutating request is audit-logged.

## Production Notes

For a production deployment (any WSGI host — Gunicorn, uWSGI, IIS, a PaaS):

- Replace `DJANGO_SECRET_KEY` and set `DJANGO_DEBUG=False`.
- Set real hostnames in `DJANGO_ALLOWED_HOSTS`, `DJANGO_CSRF_TRUSTED_ORIGINS`, and `CORS_ALLOWED_ORIGINS`.
- Terminate HTTPS in front of the app and enable `DJANGO_SECURE_SSL_REDIRECT=True`, secure cookies, and HSTS.
- Switch to MySQL (or another production database).
- Run `python manage.py collectstatic` — WhiteNoise serves static files without a separate web server.
- Build the frontend with `npm run build` and serve `frontend/dist/` from any static host, pointing `VITE_API_BASE_URL` at the API.
- Replace the console email backend with SMTP or a transactional mail provider.

## Documentation

- [Architecture](docs/architecture.md)
- [API Endpoints](docs/api_endpoints.md)
- [MySQL Schema Reference](docs/database_schema.sql)
