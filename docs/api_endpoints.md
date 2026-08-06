# API Endpoint Map

Base path: `/api/v1/`

## Authentication and RBAC

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/auth/register/` | Register a normal user |
| POST | `/auth/login/` | JWT login with login attempt tracking |
| POST | `/auth/logout/` | Blacklist refresh token and revoke session |
| GET/PATCH | `/auth/me/` | Current user profile |
| POST | `/auth/password-reset/` | Request password reset |
| POST | `/auth/password-reset/confirm/` | Confirm password reset |
| POST | `/auth/verify-email/` | Verify email token |
| GET/POST | `/auth/users/` | Admin user management |
| POST | `/auth/users/{id}/activate/` | Activate account |
| POST | `/auth/users/{id}/deactivate/` | Deactivate account |
| GET/POST | `/auth/roles/` | Admin role management |
| GET | `/auth/sessions/` | User sessions |
| POST | `/auth/sessions/{id}/revoke/` | Revoke session |

## Training

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/training/categories/` | Lesson category CRUD |
| GET/POST | `/training/lessons/` | Lesson CRUD |
| GET | `/training/lessons/{slug}/` | Lesson detail (slug lookup) |
| GET | `/training/lessons/recommended/` | Recommended lessons |
| POST | `/training/lessons/{slug}/progress/` | Update lesson progress |
| POST | `/training/lessons/{slug}/complete/` | Mark complete |
| POST/DELETE | `/training/lessons/{slug}/bookmark/` | Bookmark / remove bookmark |
| GET | `/training/progress/` | User progress records |
| GET | `/training/bookmarks/` | User bookmarks |

## Quizzes

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/quizzes/quizzes/` | Quiz CRUD |
| GET | `/quizzes/quizzes/{id}/` | Quiz detail with questions |
| POST | `/quizzes/quizzes/{id}/start/` | Start attempt |
| POST | `/quizzes/quizzes/{id}/submit/` | Submit and grade attempt |
| GET | `/quizzes/quizzes/{id}/attempts/` | User attempts for quiz |
| GET | `/quizzes/attempts/` | Attempt history |

## Phishing

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/phishing/simulations/` | Simulation CRUD |
| POST | `/phishing/simulations/{id}/submit/` | Submit classification |
| GET | `/phishing/attempts/` | Attempt history |

## Incidents

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/incidents/categories/` | Incident category CRUD |
| GET/POST | `/incidents/incidents/` | Incident list and report submission |
| GET/PATCH | `/incidents/incidents/{id}/` | Incident detail/update |
| POST | `/incidents/incidents/{id}/submit/` | Submit draft |
| POST | `/incidents/incidents/{id}/assign/` | Assign officer |
| POST | `/incidents/incidents/{id}/transition/` | Change status |
| GET | `/incidents/incidents/queue/` | SOC Kanban queue |
| GET | `/incidents/incidents/heatmap/` | Severity/status heatmap |
| GET | `/incidents/updates/` | Timeline updates |
| GET | `/incidents/assignments/` | Assignment history |

## Alerts, Analytics, Audit

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/alerts/alerts/` | Alert management and rendering |
| GET | `/alerts/notifications/` | Notification center |
| POST | `/alerts/notifications/{id}/read/` | Mark notification read |
| POST | `/alerts/notifications/read_all/` | Mark all read |
| GET | `/analytics/me/` | User dashboard metrics |
| GET | `/analytics/organization/` | Organization analytics |
| GET | `/analytics/charts/` | Chart-ready analytics |
| GET | `/audit/logs/` | Search audit logs |
| GET | `/audit/logs/export/` | CSV export |
