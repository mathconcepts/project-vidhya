---
# Alternative body for recurrence-relations.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: recurrence-relations.hook.assured
concept_id: recurrence-relations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: recurrence-relations.hook
for_stance: assured
---

Reporting only the homogeneous solution is wrong, not merely incomplete, whenever $f(n)\ne0$: the general solution needs a particular part too, shaped to match $f(n)$ itself — a polynomial $f(n)$ needs a polynomial guess, an exponential one needs an exponential guess — and gets multiplied by an extra factor of $n$ exactly when that guess collides with a homogeneous root. Skipping the particular part, or skipping the collision check, is where the marks disappear here.
