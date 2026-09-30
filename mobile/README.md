# CyberShield Hub — mobile app

Flutter client for the CyberShield Hub API (`../backend`). It targets the learner and
incident-reporter experience; SOC and admin tooling stays on the web app.

| Area | What you can do |
| --- | --- |
| Sign in / register | JWT login with automatic token refresh; tokens live in the platform keystore |
| Home | Security score, learning progress, quiz and phishing averages, recommended lessons |
| Learn → Lessons | Search and filter, read Markdown lessons, reading progress, bookmarks, mark complete |
| Learn → Quizzes | Timed attempts (resumable), per-topic breakdown, answer review with explanations |
| Learn → Phishing lab | Inspect an email and its links, flag red flags, give a verdict, get coaching |
| Incidents | Report an incident, follow its status timeline (staff see all incidents) |
| Alerts | Security advisories and tips with an unread badge, mark read |
| Account | Edit profile, change password, sign out |

## Run it

Start the backend first (see the root README), then:

```bash
cd mobile
flutter pub get
flutter run                                   # Android emulator: reaches the host at 10.0.2.2:8000
```

The API address defaults to `http://10.0.2.2:8000/api/v1` on Android and
`http://localhost:8000/api/v1` elsewhere. Override it for a physical phone (use your
computer's LAN address) or a deployed server:

```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.20:8000/api/v1
flutter build apk --release --dart-define=API_BASE_URL=https://hub.example.com/api/v1
```

Notes:

- Debug builds allow plain HTTP so they can reach the dev server; release builds are HTTPS-only.
  Set `DJANGO_ALLOWED_HOSTS` on the backend to include the address the phone uses.
- Git Bash on Windows rewrites arguments that start with `/` (e.g. `--dart-define=API_BASE_URL=/api/v1`);
  prefix the command with `MSYS_NO_PATHCONV=1` or use PowerShell.
- Demo accounts from `python manage.py seed_demo` work here too (`user@cybershield.local` / `CyberShield123!`).
- A web build (`flutter build web`) is only for quick previews; the backend's CORS allow-list is
  configured for the React app's origin.

## Tests

```bash
flutter analyze
flutter test                                  # model parsing + a full-app widget walkthrough (mocked API)
flutter test test/live_smoke_test.dart \
  --dart-define=LIVE_API=1 --dart-define=API_BASE_URL=http://localhost:8000/api/v1
```

The live smoke test exercises every endpoint the app uses against a running backend. It
registers a throwaway `mobile-smoke-*@example.test` user, so it never touches the demo accounts.

## Layout

```
lib/
  api/        ApiClient (envelope unwrapping, refresh-on-401, error messages) + typed endpoint wrappers
  models/     plain data classes, tolerant of DRF quirks (decimals as strings, omitted nulls)
  state/      AuthState (session lifecycle), AlertsState (shared unread badge)
  screens/    one file per area
  widgets/    shared UI (cards, pills, LoadView with pull-to-refresh, Markdown renderer)
```

Not included (web only): password-reset by email token, email verification, SOC queue,
analytics, audit log, and the admin content/user management screens.
