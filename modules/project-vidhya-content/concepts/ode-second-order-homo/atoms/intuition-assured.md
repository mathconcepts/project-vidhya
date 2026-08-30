---
# Alternative body for ode-second-order-homo.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: ode-second-order-homo.intuition.assured
concept_id: ode-second-order-homo
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: ode-second-order-homo.intuition
for_stance: assured
---

$e^{rx}$ is never zero, so the substituted equation can only vanish if the bracket $ar^2+br+c$ itself does — the entire reason a differential equation collapses into ordinary factoring once $r$ is known.

Distinct real roots give $c_1e^{r_1x}+c_2e^{r_2x}$. A repeated root $r$ needs $(c_1+c_2x)e^{rx}$, never $c_1e^{rx}+c_2e^{rx}$ — one function under two labels isn't two independent solutions. A complex pair $\alpha\pm i\beta$ needs $e^{\alpha x}(c_1\cos\beta x+c_2\sin\beta x)$, not the bare complex-exponential form of the same pair.
