# `data/content-library/seed/` — Built-in starter content

This directory ships with the codebase. It contains the starter concepts the content-library module loads at boot. Each subdirectory is one concept and has the same three-file shape used in `modules/project-vidhya-content/concepts/`:

```
<concept-id>/
├── meta.yaml          required — concept metadata (see schema below)
├── explainer.md       required — main explainer body
└── worked-example.md  optional — worked example body
```

## Schema (`meta.yaml`)

```yaml
concept_id: derivatives-intro          # must match the directory name
title: Derivatives                     # human-readable title
licence: MIT                           # SPDX-style identifier
contributor: Project Vidhya Seed       # who wrote it
contributor_github: project-vidhya     # optional
reviewed_at: 2026-04-24                # ISO date of last review
difficulty: intermediate               # intro | intermediate | advanced
derived_from: null                     # if a derivative work, link to source
wolfram_checkable: true                # whether this concept can be Wolfram-verified
tags:                                  # free-text list, used for filtering
  - calculus
  - derivatives
exams:                                 # which exams this concept maps to
  - EXM-BITSAT-MATH-SAMPLE
  - EXM-JEEMAIN-MATH-SAMPLE
prereqs:                               # optional, list of concept_ids
  - limits
```

## Adding new seed entries

1. Create a new directory under `seed/` named `<concept-id>` (lowercase kebab-case).
2. Add the three files following the schema above.
3. Commit. The next deployment picks them up at boot — no migration needed.

Validation: at boot the loader checks that `meta.yaml` parses, `concept_id` matches the directory name, and `explainer.md` exists. If any of those fail, the entry is skipped with an error logged; the rest of the library still loads.

## Seeds vs additions

The library has two sources:

- **Seeds** (this directory) — committed in source control, ships with the repo, cannot be modified at runtime. The "predefined" content in [LIBRARY.md](../../LIBRARY.md).
- **Additions** (`.data/content-library-additions.jsonl`) — appended at runtime via `POST /api/content-library/concept`. Per-deployment, survives restarts on a writable disk.

Additions override seeds when both have the same `concept_id`. This means a deployment can keep the shipped seed for `derivatives-intro` while adding their own `derivatives-intro` that supersedes it locally — without forking the repo.

## Why this isn't `modules/project-vidhya-content/`

Both directories hold concept files in the same format. They serve different purposes:

- `modules/project-vidhya-content/` is a **community sub-repo** for git-committed external contributions (pinned by SHA in `content.pin`).
- `data/content-library/seed/` is the **starter library** the content-library module ships with — runtime-augmentable via API, no commit required.

The two surfaces stay separate so the seed library can grow without coupling to the sub-repo's release cadence.
