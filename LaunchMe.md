# LaunchMe — Run CyberShield Hub on a new PC

Step-by-step setup for a fresh machine. The backend (Django) and web frontend (React) are required; the mobile app (Flutter) is optional.

## 1. Install prerequisites

| Tool | Version | Needed for | Check |
| --- | --- | --- | --- |
| Git | any recent | cloning the repo | `git --version` |
| Python | 3.12+ | backend | `python --version` |
| Node.js (with npm) | 20+ (CI uses 22) | web frontend | `node --version` |
| Flutter SDK | Dart `^3.13.2` (recent stable) | mobile app (optional) | `flutter doctor` |
| Android Studio / emulator | any | mobile app on Android (optional) | |

On Windows, tick **"Add Python to PATH"** in the Python installer.

## 2. Get the code

```bash
git clone <your-repo-url> cybershield-hub
cd cybershield-hub
```

Or copy the project folder over. You can skip `node_modules/`, `frontend/dist/`, `mobile/build/` and `backend/.venv` / `backend/venv` — they are rebuilt below.

## 3. Create the environment file

The `.env` file is not committed. From the project root:

```bash
# macOS / Linux / Git Bash
cp .env.example .env
```

```powershell
# Windows PowerShell
Copy-Item .env.example .env
```

The defaults work as they are: SQLite, debug on, and the frontend origin `http://localhost:5173`.
Optionally set `DJANGO_SECRET_KEY` to any long random string.

## 4. Start the backend (Terminal 1)

```powershell
cd backend
python -m venv .venv
.venv\Scripts\activate            # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_demo        # creates demo accounts + sample content
python manage.py runserver
```

If PowerShell blocks activation, run once: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

Check it works:

- Health check: http://127.0.0.1:8000/health/
- Swagger docs: http://127.0.0.1:8000/api/v1/docs/
- Django admin: http://127.0.0.1:8000/admin/

To let a physical phone or another PC reach the API, run `python manage.py runserver 0.0.0.0:8000` and add that machine's LAN IP to `DJANGO_ALLOWED_HOSTS` in `.env`, e.g. `localhost,127.0.0.1,192.168.1.20`.

## 5. Start the web frontend (Terminal 2)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The Vite dev server proxies `/api` to the backend on port 8000, so the backend must be running.

## 6. Log in with the demo accounts

| Email | Password | Role |
| --- | --- | --- |
| `admin@cybershield.local` | `CyberShield123!` | System administrator |
| `user@cybershield.local` | `CyberShield123!` | Normal user |

These exist only if you ran `seed_demo` in step 4. Change or remove them before any real deployment.

## 7. (Optional) Run the mobile app

Start the backend first, then:

```bash
cd mobile
flutter pub get
flutter doctor        # fix anything it flags (Android SDK licences, etc.)
flutter run
```

- **Android emulator:** works out of the box (reaches the host at `10.0.2.2:8000`).
- **Physical phone:** the phone must be on the same network as the PC. Run the backend on `0.0.0.0:8000` (see step 4), then:
  ```bash
  flutter run --dart-define=API_BASE_URL=http://<PC-LAN-IP>:8000/api/v1
  ```
- **Windows Firewall:** allow inbound TCP on port 8000 if the phone can't connect.
- In Git Bash, prefix commands with `MSYS_NO_PATHCONV=1` or use PowerShell.

## 8. (Optional) Run the tests

```bash
cd backend
pip install -r requirements-dev.txt
pytest
```

```bash
cd mobile
flutter analyze
flutter test
```

## 9. (Optional) Use MySQL instead of SQLite

1. Create a MySQL 8 database and user.
2. In `.env`, set `DB_ENGINE=mysql` and fill in `MYSQL_DATABASE`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_HOST`, `MYSQL_PORT`.
3. Uncomment `mysqlclient` in `backend/requirements.txt`, then `pip install mysqlclient` (on Windows this may need a matching wheel or the MySQL C connector).
4. Re-run `python manage.py migrate` and `python manage.py seed_demo`.

## Quick start (after the first-time setup)

```powershell
# Terminal 1
cd backend; .venv\Scripts\activate; python manage.py runserver
# Terminal 2
cd frontend; npm run dev
```

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| `python` not found | Reinstall Python with "Add to PATH", or use `py -3.12` on Windows |
| `ModuleNotFoundError` | The venv isn't activated, or `pip install -r requirements.txt` was skipped |
| Frontend shows network / 502 errors | Backend isn't running on port 8000 |
| `DisallowedHost` error | Add the host or IP to `DJANGO_ALLOWED_HOSTS` in `.env`, then restart the backend |
| CORS or CSRF errors in the browser | Add the frontend URL to `CORS_ALLOWED_ORIGINS` and `DJANGO_CSRF_TRUSTED_ORIGINS` in `.env` |
| Port already in use | Stop the other process, or use `runserver 8001` (then update the Vite proxy in `frontend/vite.config.js`) |
| Can't log in with demo accounts | Run `python manage.py seed_demo` |
| Existing data missing on the new PC | SQLite data lives in `backend/db.sqlite3`. Copy that file over, or just re-seed. |
