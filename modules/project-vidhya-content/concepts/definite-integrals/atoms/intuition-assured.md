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
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: definite-integrals.intuition
for_stance: assured
---

Odd/even symmetry only fires over an interval **symmetric about the origin** — $\int_{-a}^{a}$, not $\int_0^{a}$ shifted to look similar. An odd integrand needs the true $[-a,a]$ bound to vanish; applying the shortcut to $\int_{-a}^{b}$ with $b\neq a$ is a fabricated shortcut, not the real one.

Additivity, $\int_a^b f+\int_b^c f=\int_a^c f$, holds even when $b$ does not sit between $a$ and $c$: the identity is algebraic, following from $\int_a^b f=-\int_b^a f$, not geometric. Treating it as valid only for an "in-between" $b$ throws away legitimate splitting points.

Path-independence is real but narrow: the value depends only on $f$, $a$, $b$ — not on which antiderivative $F$ is chosen, since any two differ by a constant that cancels in $F(b)-F(a)$. It says nothing about the *technique* used to reach $F$; a wrong antiderivative still returns a wrong number regardless of how cleanly the bounds are handled.
