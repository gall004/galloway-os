---
trigger: always_on
description: Architecture, DRY Principle & Service-Layer Separation
---

## 1. The DRY Principle
* **Rule:** Never duplicate logic. Apply the Rule of Three — if logic appears in two places, consider abstraction; if it appears in three, mandate it.
* **Enforcement:** Extract shared logic into `src/server/utils/` for backend or `src/client/scripts/` for frontend. Inline helpers within the same file are acceptable only if the logic is tightly coupled and file-specific.

## 2. Single Responsibility & File Size
* **Rule:** Each file should have a single, well-defined responsibility.
* **Enforcement:** Source files should aim for ≤200 lines. Any file exceeding 250 lines MUST be aggressively refactored.

## 3. The Thin Transport Rule
* **Rule:** Express route handlers in `src/server/routes/` are strictly transport layers. They parse the HTTP request, call a service, and return the response.
* **Enforcement:** Business logic, database queries, data transformation, and validation belong in `src/server/services/`. Route handlers must never exceed 30 lines of logic — if they do, extract into a service.

## 4. Configuration as Code
* **Rule:** All application configuration must be centralized in `src/server/config.js`.
* **Enforcement:** No magic strings scattered across route handlers or services. Config values are read from environment variables with sane defaults via `process.env`.

## 5. Project Directory Structure
* **Rule:** Follow the directory layout defined in the Project Operating Plan (Section B).
* **Enforcement:**
  * `src/server/routes/` — Express route handlers only
  * `src/server/services/` — Business logic only
  * `src/server/models/` — SQLite schema and data access only
  * `src/server/middleware/` — Auth, validation, error handling
  * `src/server/utils/` — Shared utilities
  * `src/client/` — All frontend code
  * `src/db/` — Migrations and seed data
  * `tests/` — All unit and integration tests
  * Never place source code outside the declared directories.
