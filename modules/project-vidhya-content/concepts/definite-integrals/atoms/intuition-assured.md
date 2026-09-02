---
# Alternative body for definite-integrals.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: definite-integrals.intuition.assured
concept_id: definite-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: definite-integrals.intuition
for_stance: assured
---

The Riemann-sum limit isn't just a definition to cite — it's the fallback when no elementary antiderivative exists, such as $\int_0^1 e^{-x^2}\,dx$. There the FTC shortcut is unavailable, and a GATE-style question instead expects a numerical estimate (trapezoidal or Simpson's) built directly from the slicing idea, not a closed form.

Symmetry only fires over an interval genuinely centered at the origin: $\int_{-a}^{a}$, not a shifted interval that merely looks balanced. And "additivity holds for any $c$" is stronger than it sounds — $\int_a^b f=\int_a^c f+\int_c^b f$ remains true even when $c$ sits outside $[a,b]$, since it follows from $\int_x^y f=-\int_y^x f$ algebraically rather than from a picture of $c$ sitting "in between."
