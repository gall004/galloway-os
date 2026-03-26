---
trigger: always_on
description: Test-Driven Development (TDD) & Quality Assurance Standards
---

## 1. The TDD Mandate
* **Rule:** All code changes MUST follow a Test-Driven Development workflow.
* **Enforcement:**
  1. **Write Tests First:** When adding a new function, service, or route handler, write the corresponding test in `tests/unit/` or `tests/integration/` BEFORE or alongside the implementation.
  2. **Red-Green Cycle:** Execute the test to confirm it fails (Red), write the implementation to make it pass (Green), then refactor.
  3. **All Tests Pass Before Commit:** `npm test` must exit with 0 failures before any commit. Test results are included in the Review Summary.

## 2. Testing Stack
* **Unit Tests (`tests/unit/`):** Use Jest or Vitest for service functions, utility functions, middleware, and isolated logic.
* **Integration Tests (`tests/integration/`):** Use Supertest with the Express app for API endpoint testing — validates routing, middleware, and service integration.

## 3. Test File Structure
* **Naming Convention:** Test files mirror source files: `task.service.test.js` for `task.service.js`.
* **Arrangement:** Use the Arrange-Act-Assert (AAA) pattern in every test method.
* **Fixtures:** Use shared test helpers or setup files for common mock data. Never duplicate test setup across files.

## 4. Sad-Path Test Enforcement
* **Rule:** TDD is not just for the "Happy Path". You must explicitly test failure scenarios.
* **Enforcement:** For every service function or route handler, write at least:
  * One test for invalid input (e.g., missing required fields, malformed JSON).
  * One test for database failure or edge case (e.g., record not found, constraint violation).
  * One test for error response format (e.g., correct HTTP status code and error message shape).

## 5. Coverage Threshold
* **Rule:** ≥80% line coverage for new code. Enforced in CI.
* **Enforcement:** CI will fail if coverage drops below threshold on changed files.

## 6. The Human-in-the-Loop Handover
* When presenting a completed feature to the user (per the Git Workflow rules), you must include the test output or coverage summary in your handover message to prove the code is stable.
