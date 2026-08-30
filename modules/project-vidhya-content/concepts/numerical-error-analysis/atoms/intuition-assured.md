---
# Alternative body for numerical-error-analysis.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-error-analysis.intuition.assured
concept_id: numerical-error-analysis
atom_type: intuition
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-error-analysis.intuition
for_stance: assured
---

## What the propagation rules quietly assume

Absolute-errors-add for sums, relative-errors-add for products: both are first-order approximations, valid while the input relative errors stay small. Push $\delta p/p$ past a few percent and neither rule tracks the true worst case any more.

The bigger risk is not that violation — it is pairing the wrong rule with the wrong operation. Sum errors are absolute; product errors are relative. Swap them and the output is still a clean, confident-looking number, wrong only because the propagation mechanism no longer matches the arithmetic it is supposed to track.

Rounding error and truncation error fail the same way for a different reason: they get diagnosed as each other. More decimal places cure a rounding problem and do nothing for a truncation one — an iterative method stopped too early converges no faster no matter how much precision is carried. Naming which of the two is actually present, before reaching for a fix, is the habit worth making automatic.
