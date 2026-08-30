---
# Alternative body for conformal-mapping.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: conformal-mapping.hook.assured
concept_id: conformal-mapping
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: conformal-mapping.hook
for_stance: assured
---

Analytic is necessary, not sufficient: $f(z)=z^2$ is entire, but at $z=0$, $f'(0)=0$, and the map doubles angles there instead of preserving them — two curves crossing at $\theta$ come out crossing at $2\theta$. Conformality has to be checked at the specific point in question, both conditions together, not "is $f$ analytic on this domain" alone; a single zero of $f'$ inside an otherwise well-behaved domain is exactly where the picture breaks.
