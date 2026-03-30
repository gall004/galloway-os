---
trigger: always_on
description: Safe Git Workflow & Branch Protection
---

## 1. The Branch Check Mandate
* Before you write, modify, or delete any code files, you must determine the current Git branch by running: `git branch --show-current`.
* If the current branch is `main`, YOU MUST NOT make any file changes yet.

## 2. Automatic Branch Creation
* **Main Branch:** If the user requests a feature, refactor, or bug fix while on the `main` branch, you must proactively generate a contextual branch name and run `git checkout -b <branch-name>`.
* **Other Branches:** If already on a non-main feature branch:
  * If the user's request is related to the current work, keep going on the same branch.
  * If the request is unrelated, prompt the user via `notify_user` asking if they want a new branch.
* Only after confirming your branch state may you proceed with modifying the codebase.

## 3. Branch Naming Convention
* **Prefixes:** `feat/`, `fix/`, `chore/`, `refactor/`, `test/`, `docs/`, `ci/`
* **Format:** `<prefix><kebab-case-description>` (e.g., `feat/kanban-board-ui`)

## 4. Conventional Commits
* **Rule:** Every commit message MUST follow the Conventional Commits specification: `type(scope): description`.
* **Types:** `feat`, `fix`, `chore`, `refactor`, `test`, `docs`, `ci`.
* **Enforcement:** Include a concise scope when applicable (e.g., `feat(api): add task CRUD endpoints`). Commit messages must be descriptive enough that `git log --oneline` serves as a readable project changelog.

## 5. The Pre-Flight Self-Review Checklist
* Before you stage, commit, and present your work, you MUST independently verify:
  1. **No Debug Leftovers:** You have removed all temporary `console.log()` statements used during development. Structured logging at appropriate levels is fine.
  2. **No Hardcoded Secrets:** You have not hardcoded any API keys, database paths, port numbers, or environment-specific URLs anywhere in the codebase.
  3. **No Commented-Out Code:** Blocks of commented-out code have been removed. Use version control to preserve history, not comments.
  4. **No Disabled Linters:** You have not used `// eslint-disable-next-line` without explicit documented justification approved by the user.
  5. **Lint Passes:** You have run `npm run lint` and confirmed zero errors. This matches what CI runs — if lint fails locally, it will fail in the GitHub Action. This step is **non-negotiable**.
  6. **No Build Artifacts:** No `node_modules/`, `dist/`, `dev-dist/`, `.env.local`, or SQLite journal files (`*.sqlite-wal`, `*.sqlite-shm`) in the working tree.

## 6. Human-in-the-Loop Code Review & Handoff
* **The Hard Stop:** When you have completed a feature on a feature branch and passed the Pre-Flight Checklist, YOU MUST NOT merge the branch into `main` automatically.
* **The Commit & Push:**
  1. Stage all changes with `git add .`.
  2. Commit with a descriptive conventional commit message.
  3. Push the feature branch to the remote repository.
* **The Handoff:** After pushing, STOP and present a "Review Summary" to the user.
* **NO AUTOMATED PRs:** You MUST NOT run `gh pr create` or `gh pr merge` without explicit user permission.

## 7. No Direct Pushes to Main
* **CRITICAL RULE:** You are NEVER permitted to push commits directly to the `main` branch.
* **Pull Requests Only:** All code integrations into `main` MUST occur via Pull Requests. Even if the user explicitly says "merge this to main", you must first ask for permission to use the GitHub CLI (`gh pr create`) to open a PR, and only run `gh pr merge` AFTER the user has explicitly approved.

## 8. Squash Merge & Post-Merge Cleanup
* **Squash Merge:** PRs should be squash-merged to maintain linear history.
* **Cleanup:** After a PR is squash-merged into `main`, the corresponding feature branch MUST be deleted:
  1. Delete the remote branch: `git push origin --delete <branch-name>`
  2. Delete the local branch: `git branch -D <branch-name>`
  3. Prune stale remote tracking refs: `git remote prune origin`
