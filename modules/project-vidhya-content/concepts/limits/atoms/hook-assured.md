---
# Alternative body for limits.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: limits.hook.assured
concept_id: limits
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: limits.hook
for_stance: assured
---

GATE's giveaway is "evaluate $\lim_{x\to a}\dots$" where direct substitution yields $\frac00$ or $\frac\infty\infty$ — and the reflex mistake is reaching for L'Hôpital's rule before checking the form actually qualifies. Applying it to a limit that substitutes to a finite nonzero value over zero differentiates a perfectly fine expression into a wrong one. The rule is conditional on the indeterminate form, not a universal shortcut for any fraction carrying a variable.
