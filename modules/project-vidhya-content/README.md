# project-vidhya-content

> **Authoritative community content for Project Vidhya.**
> Human-authored explainers, worked examples, and exam-bundle
> manifests that the main [project-vidhya](https://github.com/mathconcepts/project-vidhya)
> repo pulls in via pinned SHA.

This repo is the **content layer** of Project Vidhya, separated from
the code so that teachers, subject-matter experts, and non-engineer
contributors can improve explainers via simple markdown PRs without
needing to touch the backend.

---

## What lives here

```
project-vidhya-content/
├── concepts/                   ← human-authored explainers
│   ├── calculus-derivatives/
│   │   ├── explainer.md        (the teachable content)
│   │   ├── worked-example.md   (step-by-step problem)
│   │   └── meta.yaml           (concept_id, licence, contributor)
│   └── ...
├── bundles/                    ← bundle manifests
│   ├── bitsat-quality-2026.json
│   ├── community-algebra.json
│   └── ...
├── LICENCE-MANIFEST.md         (per-bundle licensing)
├── CONTRIBUTING.md             (how to contribute)
├── VERSION                     (semver + SHA, cut on releases)
└── README.md                   (this file)
```

---

## How the main repo uses this

The main `project-vidhya` repo has a file called `content.pin`:

```
repo: mathconcepts/project-vidhya-content
sha:  abc123def456...
pinned_at: 2026-04-24
```

On deploy (via `scripts/content-sync.ts` in the main repo), it:

1. Reads `content.pin`
2. Clones this repo at the pinned SHA
3. Copies `bundles/` and `concepts/` into `.data/community-content/`
4. The content-router at runtime reads them and serves to users
   who have subscribed to the relevant bundle

**The pin is a commit SHA, not a branch.** This gives the main repo
**atomic correctness** — a mid-flight content change can't break
production until a main-repo maintainer reviews and bumps the pin.

---

## Contributing

See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Short version:

1. Fork this repo
2. Edit a concept's `explainer.md` (or add a new concept folder)
3. Run the PR checks locally: `node scripts/check.js`
4. Open a PR — CI runs markdown-lint, licence-presence, and
   Wolfram-verify on any numerics in your content
5. A content-repo maintainer reviews and merges
6. Every few weeks, a main-repo maintainer bumps
   `content.pin` to the latest release SHA here — your
   content goes live in the next deploy

---

## Licensing

Each bundle declares its licence in `LICENCE-MANIFEST.md`. The
default is **MIT** for authored content, with original authorship
preserved in each concept's `meta.yaml`. Works derived from
CC-BY-SA sources (e.g. Wikipedia, OpenStax) must be committed
with their origin licence intact — `meta.yaml` has a
`derived_from` field for this.

---

## Quality bar

Every explainer should:

- Be clear to a student seeing the concept for the first time
- Use only maths notation a student would recognize at that level
- Include at least one worked example
- Be maths-correct (numerics will be Wolfram-verified in CI)
- Be pedagogically honest — no "trivially", no
  "just", no shortcuts that skip reasoning a student needs

The main repo's `verification-manager` and `concept-reviewer`
agents will sample content from merged PRs; bundles that fail
review are quarantined until re-reviewed, not merged blind.

---

## Status

This is the **seed** of the content repo. Three concept folders
are populated as demonstration of the contribution pattern. As
contributors add more, the `VERSION` file is cut at milestones
and the main repo bumps its pin.

Initial seed:

- `calculus-derivatives/` — derivative from first principles, with BITSAT-style worked example
- `linear-algebra-eigenvalues/` — eigenvalue intuition + worked example
- `complex-numbers/` — polar form + Euler's identity

Initial bundles:

- `bitsat-quality-2026.json` — high-quality BITSAT Math explainers
- `community-algebra.json` — foundational algebra, any exam
