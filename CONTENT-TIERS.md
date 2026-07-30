# Content generation tiers — acquisition strategy with a Claude-only fallback

> **Status:** new · 2026-07-30 · companion to [`CONTENT.md`](./CONTENT.md)
> **Relationship to CONTENT.md:** CONTENT.md's Layer 1 (Sources) and Layer 2
> (Acquisition) describe *what kinds* of sources exist and the record shape
> they produce. This document adds the missing piece: the **priority order**
> in which Vidhya actually tries to fill a content gap for a given concept,
> and what happens when higher tiers aren't available — down to a fully
> degraded, single-model, Claude-only path that still produces content safe
> enough to ship. CONTENT.md's Layer 6 routing priority list (how a *served*
> request picks among already-acquired content) is the delivery-side mirror
> of this; this document is the acquisition-side tiering that fills the well
> those routing tiers draw from.

## Why a tiered strategy, not one pipeline

"Scrape everything, generate the rest" isn't a strategy — it's two options
with no decision rule between them, and no fallback when either breaks.
Scraping fails silently (licence terms change, a site goes dark, rate
limits kick in). Generation infra fails silently too (an API key expires, a
worker queue backs up, a Wolfram license lapses). A course launch date
doesn't wait for either to get fixed. The fix is a tier ladder: try the
cheapest, most-trustworthy source first, and have every tier below it able
to stand alone if everything above it is unavailable.

**The tier that matters most for this document is the bottom one.** Every
tier above it needs infrastructure this Cowork session does not have —
no scraper workers, no licensed API keys, no Wolfram Alpha credential, no
multi-model routing. Tier 3 needs none of that. It is what actually built
the live chapter sample shipped alongside this document
(`GATE-EM-Chapter-LinearAlgebra/`), and it's a legitimate, permanent part
of the ladder, not a session-only workaround.

## The four tiers

```
  TIER 0   Shipped / cached bundle       zero cost, already verified
              │  (concept not covered, or bundle stale)
              ▼
  TIER 1   Scraping — open-licence /     acquisition-manager +
           official sources             scraper-operator + licence-checker
              │  (source unreachable, licence blocks reuse, or
              │   scraper/licence-checker infra not wired)
              ▼
  TIER 2   Multi-model generation +      llm-router-manager (E1 budget
           Wolfram verification          ladder) + wolfram-verifier
              │  (no routing infra, no Wolfram credential, or
              │   latency/cost budget doesn't allow multi-call)
              ▼
  TIER 3   CLAUDE-ONLY FALLBACK          single model, self-check,
                                         deterministic CAS (SymPy)
```

### Tier 0 — Shipped / cached bundle

**Cost:** zero. **Trust:** `human_verified` or long-lived `machine_verified`.

The four-tier delivery cascade in `src/content/resolver.ts` (CONTENT.md
Layer 7) already checks this first at serve time. On the acquisition side,
the equivalent check is: *is there already a verified content record for
this `concept_id`, and is it still within its re-verification window?* If
yes, nothing below this tier runs. This is the only tier that costs
nothing per request — every tier below it exists because tier 0 came up
empty for some concept.

### Tier 1 — Scraping open-licence / official sources

**Owner:** `acquisition-manager` + `scraper-operator` + `licence-checker`
(existing, per CONTENT.md §Layer 1a/1b). **Trust:** `machine_verified` on
ingest, promotable to `human_verified` after `concept-reviewer` pass.

Preferred because it's human-authored and (when licensed correctly) legally
clean and pedagogically field-tested. The concrete source list (OpenStax,
official GATE papers, Wikipedia/Wikiversity, textbook problem sets with
explicit reuse terms) already lives in [`CONTENT.md` §Layer 1a/1b](./CONTENT.md#layer-1--sources)
— not repeated here to avoid the two docs drifting out of sync. The only
thing this document adds at this tier: GATE-specific priority is OpenStax
first (cleanest licence, best-fit for Calculus/Diff-Eq foundations),
official papers for question stems only (answer keys aren't reusable
explanations — still needs original authoring), Wikipedia as authoring
*input* rather than shippable content.

**Every source here still needs `licence-checker` wired and reachable, and
a scraper worker with network access.** Neither exists in this Cowork
sandbox session — no outbound scraping tool is connected, and licence
verification against a live source can't run without network access to
that source. That's the trigger that drops to Tier 2.

### Tier 2 — Multi-model generation + Wolfram verification

**Owner:** `llm-router-manager` (the E1 budget ladder from the blueprint)
+ `wolfram-verifier`. **Trust:** `machine_verified`, queued for
`concept-reviewer` promotion — same trust tier as Tier 1, weaker
provenance (nothing human-authored upstream), so it needs a deliberately
higher review-queue priority.

This is the **production** content factory path once infra is wired: a
cheap model drafts multiple candidate items, a mid-tier model structures
and checks them for pedagogical soundness, and only the hardest or
highest-stakes items ever reach the top-tier model — the routing ladder
that keeps the blueprint's target of <₹10/student/month realistic at
scale. Every computable claim (a numeric answer, a determinant, an
integral) is submitted to the Wolfram Alpha API and any disagreement
blocks the item from promotion — never patched by asking the LLM to
"double check," because an LLM re-checking its own math is not
independent verification.

**This needs:** a wired multi-model router, a Wolfram Alpha API
credential, and a job queue with a latency/cost budget that tolerates
several model calls per item. None of that is available in this session
— no external API credentials are configured, and there's no
multi-model routing infrastructure to call into. That's the trigger that
drops to Tier 3.

### Tier 3 — Claude-only fallback (what built today's sample)

**Owner:** whichever single model is available in the current session —
here, Claude. **Trust:** `machine_verified`, **explicitly flagged for
priority human review** before wide release — this tier's provenance is
the weakest of the four, so it should never silently reach
`human_verified` status without an actual human pass, even though the
verification step below is real and automated.

This is the fallback for when *nothing* above it is reachable: no
scraper, no licence-checker, no Wolfram credential, no multi-model
routing — exactly this Cowork sandbox's situation, and plausibly any
constrained deploy environment, a fresh dev machine before secrets are
configured, or an outage of the production content pipeline. The pipeline
has four steps, and the third one is the whole point:

1. **Draft.** Claude authors the item: stem, options/answer, a worked
   solution, and (new to this tier) a short concept explainer — the
   Layer-3 authoring-layer output CONTENT.md already names, just produced
   by a single model instead of `explainer-writer` + scraped source
   material.
2. **Independent self-check.** A second, separate pass reviews the draft
   adversarially — not "does this look right" but "what's wrong with
   this": ambiguous wording, a distractor that's arguably also correct, a
   solution that skips a step a student would get stuck on. This is
   cheap insurance against the most common single-model failure mode
   (confidently wrong), even though it's still the same underlying model
   family and can't catch everything a second, different model would.
3. **Deterministic CAS verification — the part that actually matters.**
   Every computable claim in the item is independently checked with
   SymPy, run as real code, not asked of the LLM. This is not a
   nice-to-have: it is the blueprint's standing rule that **LLM math is
   never trusted outright** (Vidhya 100x Blueprint, key tech decisions —
   "MCQ/numeric graded deterministically, never trust LLM math"), applied
   to *generation* the same way it already applies to *grading*. An item
   whose SymPy check disagrees with the drafted answer is dropped, not
   patched — patching would mean trusting the same unverified process
   that produced the error in the first place.
4. **Tag and queue.** Surviving items are recorded with
   `source: "generated"`, `licence: "internal"`, and
   `verified: { by: "sympy+claude-self-check", confidence: <machine
   tier> }`, entering `machine_verified`. They are queued for
   `concept-reviewer` promotion to `human_verified` — and per the
   provenance note above, that queue entry should be prioritized ahead of
   Tier 1/2 items, not treated identically to them.

**What shipped through this pipeline today:** all 24 items in
`GATE-EM-Chapter-LinearAlgebra/index.html` — 8 subtopics, 3 items each,
every numeric/symbolic claim (determinants, eigenvalues, rank, LU
multipliers, Cayley–Hamilton derivations, matrix products) independently
verified with SymPy in this session before being written into the sample.
The verification transcript (matrices in, SymPy output, cross-checked
against the drafted answer) is reproducible from the item set — nothing
here is "trust the model because it sounds right."

## Decision table — which tier fires, and why

| Condition | Tier used |
|---|---|
| Verified content already exists for this concept, not stale | 0 |
| No content yet; scraper + licence-checker reachable; a licensed source covers this concept | 1 |
| No content yet; scraping unavailable or licence-blocked; multi-model router + Wolfram credential available | 2 |
| No content yet; **no external infra reachable at all** (this session's exact situation) | **3** |
| Tier 3 output exists but hasn't been through `concept-reviewer` | still `machine_verified` — served with source disclosure, not withheld, per CONTENT.md's honesty-over-blocking stance for source badges |

## This is not a one-way trip

Tier 3 output isn't throwaway. When Tier 1/2 infrastructure gets wired
into a deploy (licence-checker has network access, a Wolfram credential is
configured, the multi-model router is live), Tier 3-generated items don't
get discarded — they stay `machine_verified`, keep serving, and get
backfilled into the human-review queue at normal priority once a human
pass confirms them, exactly like any other `machine_verified` record in
CONTENT.md's Layer 4. New chapters built after that point should default
to Tier 1 → Tier 2 → Tier 3 in order, falling to Tier 3 only for concepts
the higher tiers genuinely can't cover yet (a brand-new syllabus topic, a
licence gap, a temporary outage) — not as the default path once better
infra exists. The point of naming Tier 3 explicitly, instead of leaving it
as an implicit "well, generate something," is that this ladder makes it
auditable: every content record's `source` field says which tier produced
it, so the mix (and the fallback rate) is a number the team can actually
watch, not a hidden default.

## What's still open

- **Tier 1 infra** (scraper-operator network access, licence-checker
  wired to real sources) is designed in CONTENT.md but not yet exercised
  end-to-end against a live external source from a running deploy.
- **Tier 2 infra** (multi-model router + Wolfram credential) — the E1
  budget ladder is a blueprint decision, not yet implemented as running
  code; `wolfram-verifier` exists per `wolfram-verify-report.json` in the
  repo but its production Wolfram Alpha credential and call volume
  budget are not yet configured.
- **Tier 3 → production promotion path**: `concept-reviewer`'s queue
  currently doesn't distinguish Tier-3-sourced items for priority review
  as recommended above — this is a small scope item, not a redesign, for
  whoever wires the review queue next.
