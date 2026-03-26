---
trigger: always_on
description: Project Governance & Meta-Documentation Standards
---

## 1. The CONTRIBUTING.md Currency Mandate
* **Rule:** If you introduce a new testing pattern, modify the Git branching strategy, add a deployment prerequisite, or change coding standards, you MUST proactively update `CONTRIBUTING.md` in the same commit.
* **Enforcement:** `CONTRIBUTING.md` must always serve as a strictly accurate, single source of truth for a new developer joining the project.

## 2. Licensing & Copyright
* **Rule:** Ensure the root `LICENSE` file remains intact. Do not overwrite or delete it during project scaffolding.
* **Enforcement:** If making widespread project updates and the copyright year is outdated, proactively offer to update it.

## 3. Versioning & Changelog
* **Commit Discipline:** Because the changelog is derived from commit history, you must strictly adhere to Conventional Commits (`feat:`, `fix:`, `chore:`, etc.) for every single commit.
* **Manual Version Updates:** Version bumps in `package.json` are done manually by the user. The agent MUST NOT autonomously modify the `version` field.

## 4. Definition of Done Enforcement
* **Rule:** No code is submitted for review until every item in the Definition of Done checklist (Section C of the Project Operating Plan) is satisfied.
* **Enforcement:** The AI agent must self-verify all 17 checklist items before presenting any Review Summary to the user.

## 5. Documentation Verification Gate
* **Rule:** Before every commit, the AI agent MUST scan the staged diff against the Trigger → Document Matrix defined in `.agents/workflows/sdlc-workflow.md`. If any trigger fires, the corresponding document update is mandatory in the same commit.
* **Enforcement:** The agent must output a Documentation Gate checklist (✓/✗ for each trigger) before staging. A commit with an unfulfilled ✗ item is blocked. This applies to ALL commits — SDLC workflow, quick fixes, hotfixes, and ad-hoc changes alike.
