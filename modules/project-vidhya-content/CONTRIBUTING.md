# Contributing to project-vidhya-content

Thank you for wanting to improve Project Vidhya's content. This repo
is specifically designed so that teachers and subject experts can
contribute without needing to touch any backend code.

---

## Quick start — add or improve a concept

```bash
# 1. Fork and clone
git clone https://github.com/<your-fork>/project-vidhya-content.git
cd project-vidhya-content

# 2. Create a concept folder (if new) or edit an existing one
mkdir -p concepts/trigonometry-identities
cd concepts/trigonometry-identities

# 3. Write the explainer
vim explainer.md

# 4. Add meta
vim meta.yaml

# 5. Run local checks
cd ../..
node scripts/check.js concepts/trigonometry-identities

# 6. Commit + PR
git checkout -b add-trig-identities
git add concepts/trigonometry-identities
git commit -m "add: trigonometric identities explainer"
git push origin add-trig-identities
# open PR on GitHub
```

---

## Concept folder shape

Every concept folder must contain:

### `explainer.md` — the teachable content (required)

Plain markdown. Plain English. Math in LaTeX (`$...$` for inline, `$$...$$` for display).

Structure suggestion (not enforced):

```markdown
# Derivative

## Intuition

(1-3 sentences explaining what a derivative *is*, not just what it computes)

## Formal definition

(the precise statement)

## Why it matters for your exam

(what the question types look like in BITSAT/JEE/UGEE)
```

### `meta.yaml` — structured metadata (required)

```yaml
concept_id: calculus-derivatives
title: Derivative
licence: MIT
contributor: <your name>
contributor_github: <your-github-handle>
reviewed_at: 2026-04-24
difficulty: intro        # intro | intermediate | advanced
derived_from: null       # or { source: "OpenStax Calculus Vol 1", licence: "CC-BY-SA-4.0" }
wolfram_checkable: true  # set false if the content has no numerics
tags:
  - calculus
  - derivatives
  - limits
```

### `worked-example.md` — step-by-step problem (recommended)

At least one worked example per concept. Full steps, shown:

```markdown
## Problem

Find the derivative of $f(x) = x^2 \sin x$.

## Solution

**Step 1** — Recognize this as a product of two functions...

**Step 2** — Apply the product rule: $(uv)' = u'v + uv'$...

**Step 3** — Compute $u' = 2x$, $v' = \cos x$...

**Step 4** — Substitute: $f'(x) = 2x \sin x + x^2 \cos x$.

## Why this problem

BITSAT asks product-rule derivatives frequently — roughly 2–3
questions per paper. JEE Main extends them to chain-rule composites.
```

---

## Adding a new bundle

Bundles group concepts for subscription. To create one:

```bash
# bundles/my-new-bundle.json
{
  "id": "my-new-bundle",
  "name": "My New Bundle",
  "description": "Two-sentence explanation of what this bundle covers.",
  "concepts": [
    "calculus-derivatives",
    "calculus-integration",
    "calculus-limits"
  ],
  "licence": "MIT",
  "maintainer": "<your-github-handle>",
  "verified": false
}
```

Every `concepts[]` entry must be a folder that exists under
`concepts/`. The PR-check script verifies this.

---

## PR checks

When you open a PR, CI runs:

1. **Markdown lint** — basic formatting (no broken links, valid YAML)
2. **Licence presence** — every concept has a licence in `meta.yaml`
3. **Bundle references** — every bundle's `concepts[]` points at
   an existing concept folder
4. **Wolfram verify** — any numerics in your explainer or worked-
   example are submitted to Wolfram Alpha for sanity-check. Flagged,
   not blocking — the maintainer reviews disagreements.

You can run all of these locally:

```bash
node scripts/check.js                    # check everything
node scripts/check.js concepts/xxx       # check one concept
```

---

## Licensing

Default is **MIT** for original content. If you're adapting from a
source:

- **Wikipedia / OpenStax** (CC-BY-SA-4.0): credit required in
  `meta.yaml.derived_from`. Your PR must preserve the share-alike
  clause.
- **Personal class notes / original writing**: MIT is fine.
- **Copyrighted source you don't own**: NOT acceptable — the PR
  will be rejected.

`LICENCE-MANIFEST.md` in the repo root tracks bundle-level
licensing.

---

## Review cadence

- A content-repo maintainer aims to review PRs within a week.
- Merged PRs do not immediately appear in Project Vidhya — they
  appear when a main-repo maintainer bumps `content.pin`. That
  typically happens every 2-3 weeks, or on-demand for urgent
  content.
- Major errors in shipped content can be hotfixed by a point-
  release pin bump.

---

## Tone guidelines — the Calm promise

Project Vidhya operates under a constitution
([four promises](https://github.com/mathconcepts/project-vidhya/blob/main/agents/_shared/constitution.md));
the Calm promise in particular means:

- **No shame language.** Never say "obviously", "trivially", "just".
- **No urgency drivers.** Don't invoke exam-date panic.
- **No skip-steps.** If a step requires algebra, show the algebra.
- **No cheerleading.** Don't say "great question!" or "you've got
  this!"

Assume the student is intelligent and wants the work shown. Meet
that assumption.

---

## Quality bar

Before opening a PR, ask yourself:

1. Would a student seeing this concept for the first time understand it?
2. Did I use only notation they'd recognise at that level?
3. Did I include at least one worked example with full steps?
4. Are all my numerics correct (try running `scripts/check.js`)?
5. Did I avoid the Calm-violations in the tone guidelines above?

If yes to all — PR it.

---

## Recognition

Every PR merged credits the contributor in:

- `meta.yaml.contributor` for that concept
- The running `CONTRIBUTORS.md` at the repo root
- A banner in the Vidhya app when a student views content
  attributed to you (planned)

Thank you for helping students learn maths better.
