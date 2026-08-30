---
# Alternative body for regression-correlation.hook, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: regression-correlation.hook.assured
concept_id: regression-correlation
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: regression-correlation.hook
for_stance: assured
---

$r=0$ rules out only a LINEAR relationship — $y=x^2$ on symmetric $x$ can have $r=0$ while $y$ is a deterministic function of $x$, no randomness involved. The regression of $y$ on $x$ and the regression of $x$ on $y$ are different lines in general, meeting only when $|r|=1$; their slopes multiply to exactly $r^2$, a fast computational check. Correlation between ice-cream sales and drowning deaths is real, large, and driven entirely by a third variable — summer heat — never mistake a strong $r$ for a causal arrow in either direction.
