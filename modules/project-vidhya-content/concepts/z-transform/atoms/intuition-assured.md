---
# Alternative body for z-transform.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: z-transform.intuition.assured
concept_id: z-transform
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: z-transform.intuition
for_stance: assured
---

Shift-to-power is mechanical: $y[n-1]\to z^{-1}Y(z)$, so a difference equation becomes a polynomial equation in $z$ with no special case beyond that one substitution.

Where marks are actually lost: ROC shape decides causality, not the algebraic form. $\dfrac{z}{z-a}$ is $a^nu[n]$ (causal) when the ROC is $|z|>|a|$, and $-a^nu[-n-1]$ (anti-causal) when it's $|z|<|a|$ — same closed form, opposite sequence, and quoting $X(z)$ alone, without its ROC, leaves the answer genuinely incomplete.

A pole strictly inside the unit circle decays, strictly outside grows — but a pole sitting *on* the circle is the trap: it gives a bounded, non-decaying oscillation (or a constant, at $z=1$), neither cleanly stable nor obviously unstable. Treating "inside or on" as one case is the generalisation that costs the mark.

The Laplace parallel holds structurally — $z=e^{sT_s}$ maps the left half-plane to the unit disk's interior — but the stability *boundary* changes shape from a line to a circle, so "negative real part" has to become "magnitude less than one," not just get relabelled in $z$.
