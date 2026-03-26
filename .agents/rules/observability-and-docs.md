---
trigger: always_on
description: Logging, Documentation & README Currency
---

## 1. Structured Logging Standards
* **Rule:** Use a structured logging library (e.g., `pino` or `winston`) with explicit levels. Never leave bare `console.log()` statements in production code.
* **Enforcement:**
  * `error` — Exceptions, database failures, and unrecoverable conditions.
  * `warn` — Unexpected but recoverable conditions (e.g., missing optional config).
  * `info` — Key execution milestones (e.g., "Server started on port 3000", "Task created: {id}").
  * `debug` — Detailed diagnostic data (e.g., full request payloads). Remove or guard these before merging to `main`.

## 2. JSDoc Headers
* **Rule:** Every exported function and class MUST have a JSDoc comment block.
* **Enforcement:** Use the standard format:
  ```javascript
  /**
   * @description Brief description of the function purpose.
   * @param {string} paramName - Description of the parameter.
   * @returns {Object} Description of the return value.
   * @throws {Error} When this error condition occurs.
   */
  ```

## 3. README Currency Mandate
* **Rule:** Any time a new environment variable, deployment prerequisite, Docker configuration change, or architectural decision is introduced, the `README.md` must be updated in the same commit.
* **Enforcement:** The README must always maintain:
  1. Project overview and strategic context.
  2. Architecture description.
  3. Prerequisites & environment setup (including `.env` block).
  4. Running the application (Docker and local development).
  5. Testing instructions (`npm test` commands).
  6. Directory structure reference.

## 4. No Silent Failures
* **Rule:** Every `try/catch` block must explicitly log the error before re-throwing or returning.
* **Enforcement:** Catch blocks must call `logger.error()` with the error message and context. Never swallow exceptions silently.
