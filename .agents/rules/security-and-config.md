---
trigger: always_on
description: Zero-Hardcoding, Environment Configuration & Secrets Management
---

## 1. Zero Hardcoding Policy
* **Rule:** Never hardcode secrets, credentials, OR environment-specific configurations (like database paths, port numbers, API endpoints, or feature flags).
* **Enforcement:** Always extract values using `process.env.VARIABLE_NAME` via `src/server/config.js` with appropriate fallbacks where necessary (e.g., `process.env.PORT || 3000`).

## 2. The `.env` Lifecycle
* **Rule:** Any time a new environment variable is introduced into the codebase, you MUST simultaneously:
  1. Add it to `.env.example` with a descriptive dummy value or instructional comment.
  2. Implement it in `src/server/config.js` using `process.env`.
  3. Update `README.md` → Environment Variables section to reflect the new requirement.
  4. Explicitly inform the user in your handover message that they must add the new key to their local `.env` file.
* **Never commit `.env` or `.env.local` to version control.**

## 3. Docker Secret Management
* **Rule:** The `Dockerfile` must NOT contain `ENV` directives with real secret values. Environment variables are injected at runtime via `docker-compose.yml` → `env_file` or `environment` block.
* **Enforcement:** The `docker-compose.yml` references `.env` for runtime configuration. Real secrets never appear in any version-controlled file.

## 4. SQLite Database Security
* **Rule:** The SQLite database file resides on the host filesystem via a Docker volume mount. It must NEVER be committed to version control.
* **Enforcement:** The database path, journal files (`*.sqlite-wal`, `*.sqlite-shm`), and any backup files are listed in `.gitignore`.
