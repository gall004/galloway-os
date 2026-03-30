# Contributing to galloway-os

This document is the single source of truth for development standards, Git workflow, and testing expectations. It must remain strictly current with the actual state of the project.

## Git Workflow

### Branch Strategy

- **`main`** is protected — no direct pushes, ever.
- All changes enter `main` via **squash-merge Pull Requests**.
- Create feature branches from `main` using the naming convention:
  ```
  <type>/<kebab-case-description>
  ```
  Allowed prefixes: `feat/`, `fix/`, `chore/`, `refactor/`, `test/`, `docs/`, `ci/`

### Commit Messages

All commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): concise imperative description
```

Examples:
- `feat(api): add task CRUD endpoints`
- `fix(db): resolve migration ordering issue`
- `chore(docker): update Node base image to v20`

### Pull Request Process

1. Push your feature branch to the remote.
2. Open a PR targeting `main`.
3. CI must pass (lint, tests, Docker build).
4. Responsive Validation: Manually check layout integrity down to 400px viewport (Modals, Tables, Carousel, AppHeader).
5. Request review from the project owner.
5. Squash-merge after approval.
6. Delete the feature branch (remote + local).

## Testing

### Stack

| Type | Tool | Location |
|------|------|----------|
| Unit tests | Jest | `tests/unit/` |
| Integration tests | Supertest | `tests/integration/` |

### Running Tests

```bash
# All tests
npm test

# With coverage
npm run test:coverage

# Unit only
npm run test:unit

# Integration only
npm run test:integration
```

### Test-Driven Development (TDD)

1. **Write tests first** — before implementation code.
2. **Red:** Run the test and confirm it fails.
3. **Green:** Write the minimum code to make it pass.
4. **Refactor:** Clean up without breaking tests.

### Test Requirements

- Every service function needs at least one happy-path and one sad-path test.
- Use the **Arrange-Act-Assert (AAA)** pattern in every test method.
- Test files mirror source files: `task.service.test.js` tests `task.service.js`.
- Minimum **80% line coverage** for new code.

## Coding Standards

### Architecture

- **Route handlers are thin transport layers** — they parse the request, call a service, return the response.
- **Business logic lives in `src/server/services/`** — never in route handlers.
- **File size limit: ≤200 lines** — refactor aggressively if approaching 250.
- **DRY (Rule of Three)** — shared logic goes in `src/server/utils/`.

### Logging

- Use the project's structured logger (e.g., `pino`) — never bare `console.log()`.
- Every `try/catch` block must log the error before handling it.
- Every exported function must have a JSDoc comment block.

### Configuration

- All config flows through `src/server/config.js` → `process.env`.
- When adding a new env var, update `.env.example`, `README.md`, and `src/server/config.js` in the same commit.

### Error Handling

- All endpoints validate input defensively.
- Error responses use a consistent JSON shape:
  ```json
  { "error": true, "message": "Description", "code": "ERROR_CODE" }
  ```
- Never return raw stack traces to the client.

## Docker

```bash
# Build and run
docker-compose up --build

# Detached mode
docker-compose up --build -d

# Teardown
docker-compose down
```

The SQLite database persists in `./data/` via volume mount.

## Linting

```bash
npm run lint
```

ESLint enforces `no-console` (warn), `prefer-const`, strict equality (`===`), and no unused variables.
