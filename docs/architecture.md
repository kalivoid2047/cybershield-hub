# CyberShield Hub Architecture

## System Diagram

```mermaid
flowchart LR
  U["Users, officers, administrators"] --> F["React + Vite frontend"]
  F --> A["Django REST API"]
  A --> J["JWT auth and RBAC"]
  A --> M["Domain services"]
  M --> T["Training"]
  M --> Q["Quiz engine"]
  M --> P["Phishing simulator"]
  M --> I["Incident response"]
  M --> R["Analytics"]
  M --> L["Alerts and notifications"]
  A --> DB[("SQLite / MySQL")]
  A --> E["Evidence storage"]
  A --> AU["Audit logging middleware"]
  AU --> DB
```

## Backend Boundaries

```mermaid
flowchart TB
  API["api/v1"] --> Users["users app"]
  API --> Training["training app"]
  API --> Quizzes["quizzes app"]
  API --> Phishing["phishing app"]
  API --> Incidents["incidents app"]
  API --> Alerts["alerts app"]
  API --> Analytics["analytics app"]
  API --> Audit["audit app"]
  Users --> Roles["roles table"]
  Training --> LessonProgress["lesson progress and bookmarks"]
  Quizzes --> Grade["grade_quiz_attempt service"]
  Phishing --> Detect["grade_phishing_attempt service"]
  Incidents --> Timeline["updates, assignments, attachments"]
  Analytics --> Aggregate["ORM aggregates"]
```

## Request Flow

```mermaid
sequenceDiagram
  participant Browser
  participant React
  participant API as Django API
  participant DB as Database
  Browser->>React: Navigate protected route
  React->>React: Read JWT and role
  React->>API: /api/v1 request with Bearer token
  API->>API: JWT authentication
  API->>API: RBAC permission check
  API->>DB: Query or mutate domain tables
  API->>DB: Write audit log for mutating request
  API-->>React: Standard JSON response
```

## Role Matrix

| Capability | Normal User | Cybersecurity Officer | System Administrator |
| --- | --- | --- | --- |
| Training and quizzes | Yes | Yes | Yes |
| Phishing simulations | Yes | Yes | Yes |
| Report incidents | Yes | Yes | Yes |
| View own incidents | Yes | Yes | Yes |
| Manage all incidents | No | Yes | Yes |
| View analytics | Own dashboard | Organization | Organization |
| Manage alerts | No | Yes | Yes |
| View audit logs | No | Yes | Yes |
| Manage users and roles | No | No | Yes |

## Data Flow Principles

- API versioning is rooted at `/api/v1/`.
- Models are normalized by domain and use foreign keys for ownership and workflow relationships.
- Services contain grading logic for quizzes and phishing attempts.
- Permissions enforce RBAC at viewset/action level.
- Middleware records mutating API calls in `audit_logs`.
- Upload validation constrains evidence files by extension and size.
- Frontend pages consume API services and use demo fallbacks only in development mode.
