# CEO Plan: Content Studio Coverage
**Date:** 2026-08-07
**Author:** CEO Review (automated via autoplan)
**Branch:** `claude/content-studio-coverage-ceo-a0m1ep`

---

## What was reviewed

The Content Studio module: seven admin-only endpoints for the draft generation →
review → approve workflow, plus the UI helper functions in
`ContentStudioPage.tsx`.

Scope: `src/api/content-studio-routes.ts`, `src/content-studio/store.ts`,
`src/__tests__/unit/api/content-studio-routes.test.ts`,
`src/__tests__/unit/data/content-studio.test.ts`,
`frontend/src/pages/app/ContentStudioPage.tsx`,
`frontend/src/pages/app/ContentStudioPage.test.ts`.

---

## Findings

### F1 — `/underperforming` endpoint has zero test coverage

**File:** `src/__tests__/unit/api/content-studio-routes.test.ts`, line 34–35

The existing test file explicitly deferred these tests:

> *"The /underperforming endpoint logic (would need synthetic teaching turns;
> deferred — the handler is straightforward read + filter and was verified live)"*

This endpoint is the GBrain feedback hook. It reads the teaching-turn log,
groups library-served turns by `concept_id`, computes average `mastery_delta`,
and returns a ranked list of underperforming entries. The filtering logic
(min\_turns gate, threshold gate, non-library exclusion, no-delta exclusion,
worst-first sort) is completely untested.

**Risk:** Silent regressions in the filter chain. A bug in the sort or threshold
comparison would not be caught before deploy.

**Fix:** Seed synthetic teaching turns in `beforeEach` using `openTurn` /
`closeTurn` from `modules/teaching` and assert the handler's output shape,
filter behaviour, and sort order.

---

### F2 — `owner` role access is untested

**File:** `src/api/content-studio-routes.ts`, line 68

```typescript
const ADMIN_ROLES = new Set(['admin', 'owner', 'institution']);
```

`owner` is in the admin set but there is no test that calls any endpoint with
the `owner` role. If `requireAdmin` is ever refactored, a regression here would
be invisible.

**Fix:** Add two tests — `owner` can `GET /drafts` (200) and `owner` can
`POST /generate` (201) — to lock the role-access contract.

---

### F3 — PATCH 404 path is untested

**File:** `src/__tests__/unit/api/content-studio-routes.test.ts`

`PATCH /draft/:id` returns 404 when the given id doesn't exist (via
`editDraft()` returning null). The existing test only covers:
- 200 success (edit fields, verify edited\_at)
- 400 empty edits

The 404 path is untested.

**Fix:** Add a test that patches a non-existent `draft_id` and asserts 404.

---

### F4 — PATCH and reject on non-draft status are untested at the route level

**File:** `src/__tests__/unit/api/content-studio-routes.test.ts`

`editDraft()` throws `"cannot edit draft in status='approved'"` when the draft
is not in `'draft'` status. The route catches this and returns 400. This
behaviour is tested in `content-studio.test.ts` at the store level, but NOT at
the route level — the route's error-propagation path is never exercised.

Similarly, `rejectDraft()` throws when rejecting an already-rejected draft, but
the route's catch path for a second rejection is untested.

**Fix:** Add:
1. A test that approves a draft then tries to PATCH it → 400 with matching
   error text.
2. A test that rejects a draft twice → second rejection returns 400.

---

## Gates

| Gate | Check | Passing before | Passing after |
|------|-------|---------------|--------------|
| G1 | `npx tsc --noEmit` zero errors | ✓ | ✓ |
| G2 | `npm test` full suite | ✓ | ✓ |

---

## Implementation order

1. **F1 — /underperforming tests** (highest value; the entire endpoint was
   deliberately deferred)
2. **F2 — owner role access** (two tests, closes a role-coverage gap)
3. **F3 — PATCH 404** (one test, two minutes)
4. **F4 — PATCH and reject on non-draft status** (two tests, closes the
   route-level error-propagation gap)

---

## Deferred / out of scope

- `institution` role testing: `makeAuthedReq` in the test harness is typed for
  `'admin' | 'teacher' | 'student' | 'owner'` only; adding `institution` would
  require extending the helper and is a separate task. Low risk — the set
  membership check is a single line.
- Frontend `ContentStudioPage.tsx` component tests: the file exports
  `__testing` helpers and `daysSince` / `staleDrafts` are already tested.
  Component-level integration tests require RTL setup with mock fetch, which is
  a larger test-infrastructure task.
- Rate-limit integration in the LLM source: requires a live `GEMINI_API_KEY`;
  excluded per the existing test file's comment.
