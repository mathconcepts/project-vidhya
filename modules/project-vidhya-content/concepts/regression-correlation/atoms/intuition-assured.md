---
# Alternative body for regression-correlation-intuition, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `regression-correlation-intuition` (no
# dot), a legacy naming drift check-content-integrity.ts tolerates.
# variant_of points at that exact id; this file's own id follows the
# normal convention instead of propagating the drift.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: regression-correlation.intuition.assured
concept_id: regression-correlation
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: regression-correlation-intuition
for_stance: assured
---

## The two-line trap

Regressing $y$ on $x$ gives slope $b_{yx}=S_{xy}/S_{xx}$; regressing $x$ on $y$ gives $b_{xy}=S_{xy}/S_{yy}$ — a DIFFERENT line, coinciding with the first only when $|r|=1$. Their product $b_{yx}\cdot b_{xy}=r^2$ always, the fastest correctness check on a two-part regression problem.

## What $R^2$ buys, and what it doesn't

$R^2=r^2$ is the fraction of $y$'s variance explained by the linear fit — it says nothing about causation and nothing about whether a NONLINEAR relationship (which can drive $r$ toward $0$) is actually present.

## Where to stop trusting the line

Extrapolating past the observed $x$-range assumes the same linear relationship continues, which the data never actually tested — treat any prediction there as a qualitative guess, not a computed value.
