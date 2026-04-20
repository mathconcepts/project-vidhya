# Contributing to Project Vidhya

Thanks for your interest in improving Vidhya. This guide explains how
the repository is structured, what kinds of contributions fit best, and
the local workflow for landing a change.

---

## Ways to contribute (in order of leverage)

### 1. Add content sources (highest leverage)

The content bundle is the core asset. Every new CC-licensed source grows
the tier-0 hit rate, which lowers per-user cost for everyone.

**What to do:** write a new scraper in `scripts/` following the existing
pattern in `scrape-corpus.ts` or `scrape-textbooks.ts`. Each record must
carry `source`, `source_url`, `license`, and `attribution` — we'll
reject PRs without proper licensing metadata.

**Acceptable sources:**
- CC-BY / CC-BY-SA / CC-BY-NC-SA (with attribution)
- Public domain
- Explicit written permission from the rights holder
- Your own original content with a permissive license

**Do not submit:**
- Content from proprietary coaching platforms
- Content scraped without license review
- User-identifiable posts from forums (even if the platform license permits)
- Content lacking a clear source URL

### 2. Extend the concept graph

`src/constants/concept-graph.ts` has 82 concepts with prerequisite edges.
Adding nodes (or fixing edges) improves the cognitive model's precision.

Schema per concept:

```typescript
{
  id: 'unique-kebab-case',            // stable, referenced from problems
  label: 'Human Readable Name',
  topic: 'broader-category',           // one of 10 topic buckets
  description: 'One-line definition',
  prerequisites: ['other-concept-id'], // DAG edge targets
  gate_frequency: 0.0-1.0,             // how often in GATE papers
  marks_weight: 1 | 2,                 // typical marks per question
}
```

Open a PR that adds nodes + updates `scripts/build-bundle.ts` if you're
also adding matching problems.

### 3. Fix Wolfram matcher edge cases

`src/services/wolfram-service.ts` has `answersAgree()` which handles most
math-answer comparison cases but currently misses algebraically-equivalent
restructured answers (e.g., `x² + x·cos(xy)` vs `x(cos(xy) + x)`).

Improvements welcome. Add cases to the test file alongside your fix.

### 4. Ship a new subject domain

The architecture is domain-agnostic. To ship a JEE/CAT/UPSC variant:

1. Fork
2. Swap `src/constants/concept-graph.ts` with the target subject's graph
3. Seed 20–50 problems in `scripts/scrape-corpus.ts`
4. Generate explainers: `npm run content:explainers`
5. Build bundle: `npm run content:bundle`
6. Update `README.md` to reflect the new target

We'll happily link to subject-specific forks from the main README.

### 5. Improve the client UX

Pages in `frontend/src/pages/gate/` are the UI surface. Submit PRs that:
- Improve accessibility (keyboard nav, ARIA, contrast)
- Reduce bundle size (code splitting, dynamic imports)
- Add new visualizations to admin dashboards
- Polish mobile layouts

Any visual change should keep the four-tier provenance badge pattern
visible — the cost transparency is part of the product.

---

## Local development setup

See [INSTALL.md](./INSTALL.md) for full setup. Minimum for contributors:

```bash
git clone https://github.com/YOUR-FORK/project-vidhya.git
cd project-vidhya
npm ci
cd frontend && npm ci && cd ..
echo "JWT_SECRET=$(openssl rand -hex 32)" > .env
npm run dev:server     # backend on :8080
```

In a second terminal:

```bash
cd frontend && npm run dev    # Vite dev server with HMR on :5173
```

---

## Code style

- **TypeScript everywhere**, `@ts-nocheck` tolerated for rapid iteration but not preferred in new files
- **Express 5 handlers** return via `ServerResponse` — see `src/api/content-routes.ts` for the pattern
- **Frontend** follows existing Tailwind + Lucide icon + framer-motion patterns — no design system overhaul PRs without prior discussion
- **No new runtime dependencies** without justification. Adding a package adds an install-time hop for everyone; prefer a 30-line local implementation when possible
- **Stateless by default** on the server. A new file creating a module-level Postgres pool is a regression

---

## Testing

```bash
# Backend unit tests
npm test

# Frontend typecheck
cd frontend && npx tsc --noEmit

# Full smoke test (requires server running)
curl http://localhost:8080/health
curl http://localhost:8080/api/content/stats
curl -X POST http://localhost:8080/api/content/resolve \
  -H "Content-Type: application/json" \
  -d '{"intent":"practice","concept_id":"eigenvalues","difficulty":0.25}'
```

For changes to the Wolfram matcher (`answersAgree`), add unit test cases
at `/tmp/test-agree.ts` or a permanent equivalent under `tests/`.

For changes to the resolver, run the local debug script:

```bash
npx tsx scripts/build-bundle.ts   # refresh bundle
# then exercise /api/content/resolve with expected + edge inputs
```

---

## Commit message convention

Follows [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

<body explaining why, with enough detail that a future you understands>

<optional footer>
```

Types we use:

- `feat` — new user-facing capability
- `fix` — bug fix
- `content` — changes to bundle / explainers / scraped data
- `docs` — documentation only
- `chore` — tooling, dependencies, config
- `refactor` — no behavior change
- `perf` — performance improvement

Examples from the repo:

```
feat(v2.2.0): Content Engine — cost-minimal four-tier delivery
fix(wolfram): strip f(x)-style function-of-variable notation
content: Wolfram-verify 6 bundle problems end-to-end
docs: add FEATURES.md — 18-slide pitch deck with every moat
```

---

## Pull request process

1. **Fork** and branch off `main`. Branch names are freeform; consider
   `content/openstax-linear-algebra` or `fix/wolfram-matcher-parens`.
2. **Keep PRs focused**. One moat change per PR. Bundling unrelated
   changes slows review.
3. **Include verification evidence** in the PR description — what you ran,
   what you saw. Smoke-test output is gold.
4. **Update docs if behavior changes**. README, INSTALL, DEPENDENCIES,
   and the relevant PLAN doc should stay in sync with code.
5. **CI runs on push**. Tests must pass. Linter warnings are non-blocking
   but noted.
6. **Review turnaround** is best-effort. Maintainers will respond within
   7 days. Complex architecture changes get more time.
7. **Squash merge** by default. Your PR is one commit on main.

---

## Reporting issues

See [SECURITY.md](./SECURITY.md) for vulnerability reports. For
everything else, open a GitHub Issue using one of the templates.

---

## Code of conduct

Be respectful. Criticize ideas, not people. Assume good faith. If you
wouldn't say it to a collaborator across a lunch table, don't say it in
a PR review.

Violations get a warning, then a ban. Maintainers' judgment is final.

---

## License

By contributing, you agree that your contributions will be licensed
under the MIT License. Third-party content in your PR must carry its
own compatible license and be properly attributed in-record.

Thank you for making Vidhya better.
