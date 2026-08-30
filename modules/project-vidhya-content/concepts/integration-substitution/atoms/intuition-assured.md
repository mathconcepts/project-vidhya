---
# Alternative body for integration-substitution.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: integration-substitution.intuition.assured
concept_id: integration-substitution
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-substitution.intuition
for_stance: assured
---

For a definite integral, substitution changes the bounds too: $\int_a^b f(g(x))g'(x)\,dx=\int_{g(a)}^{g(b)}f(u)\,du$. Skipping that conversion while still evaluating in terms of $u$ silently reintroduces the wrong numbers; substituting back to $x$ before evaluating works too, but only one of the two bound-conventions may be used, never a mix.

Trig substitution needs its restricted range respected: $x=\sin\theta$ requires $\theta\in\left[-\frac\pi2,\frac\pi2\right]$ so that $\sqrt{1-x^2}=\cos\theta$ stays nonnegative — outside that range $\cos\theta$ can be negative, and $\sqrt{1-x^2}=|\cos\theta|\neq\cos\theta$ silently flips a sign. The restriction is not a technicality; it is what makes the substitution a genuine, invertible change of variable rather than a many-to-one relabeling.

The check that catches a bad substitution before it costs marks: does $du$, exactly as computed, actually appear in the integrand — not approximately, not up to a sign that got absorbed without comment.
