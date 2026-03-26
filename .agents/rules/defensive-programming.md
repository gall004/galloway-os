---
trigger: always_on
description: Error Handling, Input Validation & Graceful Degradation
---

## 1. Defensive Input Validation
* **Rule:** All public-facing API endpoints must validate input before processing. Never trust client-provided data.
* **Enforcement:**
  * Validate required fields exist and are of expected types.
  * Return descriptive `400 Bad Request` responses with a structured error payload for malformed input.
  * Log invalid requests at `warn` level for observability.

## 2. Error Response Contracts
* **Rule:** Error responses returned to the client must follow a consistent, structured format.
* **Enforcement:** Define and use a standard error schema consistently:
  ```json
  { "error": true, "message": "Human-readable description", "code": "TASK_NOT_FOUND" }
  ```
  Never return raw stack traces or unstructured error strings to the client.

## 3. Null-Safe Data Access
* **Rule:** When accessing nested fields in request bodies, query parameters, or database results, always use defensive access patterns.
* **Enforcement:** Check for `undefined`/`null` before accessing nested properties. A missing field in a database row should trigger a graceful `404` response, not an unhandled `TypeError` crash.

## 4. Timeout & Retry Strategy
* **Rule:** All database operations must have reasonable time expectations. Long-running SQLite queries should be guarded against infinite hangs.
* **Enforcement:** Set `busy_timeout` on the SQLite connection. If a query fails due to a locked database, return a `503 Service Unavailable` with a retry-friendly message.

## 5. Health Check Endpoint
* **Rule:** The application must expose a `GET /healthz` endpoint that returns `200 OK` when the service is ready.
* **Enforcement:** The health check should verify the SQLite database connection is alive and return `503 Service Unavailable` if the database is unreachable.
