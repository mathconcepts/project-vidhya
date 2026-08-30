---
# Alternative body for recurrence-relations.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: recurrence-relations.intuition.assured
concept_id: recurrence-relations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: recurrence-relations.intuition
for_stance: assured
---

A linear recurrence's general solution is homogeneous-plus-particular, and both parts are required whenever $f(n)\ne0$ — reporting only the homogeneous root sum is an incomplete answer, not a simplified one. The particular guess must match $f(n)$'s form (polynomial degree for a polynomial $f(n)$, matching base for an exponential $f(n)$), and gets multiplied by $n$ (or $n^2$) exactly when the naive guess collides with a homogeneous root — skipping that collision check is the standard failure mode.

Order is how many steps back the rule reaches, fixed by the recurrence itself, and the number of initial conditions needed equals the order exactly — a second-order recurrence needs two starting values, not one, to pin a unique sequence out of the whole family the characteristic equation allows.

Distinct real roots, repeated roots, and complex roots each change the general solution's shape: a repeated root $r$ contributes $(A+Bn)r^n$, not $Ar^n$ counted twice — treating a repeated root as two distinct ones under-determines the solution.
