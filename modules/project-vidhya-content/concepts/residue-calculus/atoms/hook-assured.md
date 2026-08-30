---
# Alternative body for residue-calculus.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: residue-calculus.hook.assured
concept_id: residue-calculus
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: residue-calculus.hook
for_stance: assured
---

The one-line summary hides a condition: it only works when every singularity inside is a pole (a finite negative-power tail). At an essential singularity like $e^{1/z}$'s at $z=0$, the residue is still just the $c_{-1}$ Laurent coefficient, but the limit shortcut $\lim_{z\to z_0}(z-z_0)f(z)$ doesn't exist — the coefficient has to come from the series itself: $e^{1/z}=\sum_{n=0}^\infty\frac{z^{-n}}{n!}$ gives residue $1$, the $n=1$ term, read off, not computed.
