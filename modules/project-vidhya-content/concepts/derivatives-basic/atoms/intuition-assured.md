---
# Alternative body for derivatives-basic.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: derivatives-basic.intuition.assured
concept_id: derivatives-basic
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
modality: visual
interactives: [derivatives-tangent-slope, parabola-explorer]
variant_of: derivatives-basic.intuition
for_stance: assured
---

The derivative existing at every point does not make $f'$ itself continuous. Take $f(x)=x^2\sin(1/x)$ for $x\neq0$, $f(0)=0$: by the squeeze theorem, $f'(0)=\lim_{h\to0}h\sin(1/h)=0$, so the derivative exists everywhere. But for $x\neq0$, $f'(x)=2x\sin(1/x)-\cos(1/x)$, and the $-\cos(1/x)$ term oscillates without settling as $x\to0$ — $f'$ has no limit at $0$, hence is discontinuous there, even though $f'(0)$ is a perfectly well-defined number.

:::interactive{ref=derivatives-tangent-slope}
:::

The distinction that matters: "differentiable at $a$" describes one single point; it says nothing about the derivative *function*'s continuity nearby. Differentiability of $f$ on an interval guarantees $f'$ satisfies the intermediate value property there (Darboux's theorem) — not that $f'$ is continuous. Confusing "the derivative exists" with "the derivative is nice" is what makes this trap work.

:::interactive{ref=parabola-explorer}
:::
