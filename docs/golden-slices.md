# Golden Slices

> **Purpose:** Non-normative calibration examples for matching work to T0–T3
> process weight. Agents may diverge with a one-line rationale when the actual
> diff has different triggers.

These are examples, not executable rules. Use `workflow-routing` for tier
selection and `slice-and-ship` when a planned T2/T3 slice is active.

## T0 — Docs-only edit

**Example:** Fix a typo in `docs/organism-pattern.md`.

**Expected rules:** core guardrails, `git-commits` if committing.

**Verification:** Read the changed paragraph; run `git diff --check`; skip tests unless runnable examples changed.

**Avoid:** Feature planning, broad audits, or full test suites for static copy.

## T1 — Local validation / test fix

**Example:** Fix one service validation branch and add a focused unit test without changing the public API contract.

**Expected rules:** relevant module spec, `go-service`, `write-tests`, `git-commits`.

**Verification:** Run the focused unit test; scoped diff review for accidental contract changes.

**Avoid:** OpenAPI, frontend types, or module spec updates unless behavior crosses a contract boundary (then escalate to T2).

## T2 — API / contract slice

**Example:** Add a new endpoint in an existing module or change a response shape consumed by the frontend.

**Expected rules:** `workflow-routing`, existing plan or `planning-standards`, `slice-and-ship`, module spec, `go-handler`, `go-service`, `write-tests`, `openapi`.

**Verification:** Update OpenAPI and specs; run focused handler/service tests; regenerate frontend types when needed; run `audit-bugs` on touched files before commit; complete slice-and-ship contract closeout.

**Avoid:** Treating a contract change as a local bug fix because the diff is small.

## T3 — Auth / security change

**Example:** Change password reset token handling, CSRF enforcement, JWT rotation, or role-sensitive route guards.

**Expected rules:** `workflow-routing`, `slice-and-ship`, auth rules, `write-tests`, `audit-bugs`, migration rules if schema changes.

**Verification:** Success and failure path tests; check rollback/degradation; scoped security audit before closeout.

**Avoid:** Downshifting to T1/T2 because the implementation touches one function.

## T3 — Multi-surface release (rare in Golid)

**Example:** Ship a feature that touches backend contract, frontend routes, docs, and CI in one release (e.g. v0.3.0 platform hardening).

**Expected rules:** `plan-feature` or parent plan, `slice-and-ship`, `parallel-subagents` for independent files, `audit-codebase` before tag.

**Verification:** Each slice has tests and same-slice doc/spec sync; parent agent owns decisions; subagents audit, parent fixes and re-audits.

## Parallel subagent batch

**Example:** Backport five independent docs files while another agent wires CSRF middleware.

**Expected rules:** `parallel-subagents`, domain rules per file, one sweep-up commit for shared files if needed (see `docs/git-reference.md`).

**Verification:** `rg` confirmation after all agents complete; no behavior change in sweep-up commits.
