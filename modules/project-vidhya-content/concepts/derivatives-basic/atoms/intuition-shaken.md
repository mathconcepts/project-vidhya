---
# Alternative body for derivatives-basic.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: derivatives-basic.intuition.shaken
concept_id: derivatives-basic
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
modality: visual
interactives: [derivatives-tangent-slope, parabola-explorer]
variant_of: derivatives-basic.intuition
for_stance: shaken
---

Look at $f(x)=x^2$ near $x=1$. At $x=0.9$, $f=0.81$; at $x=1.1$, $f=1.21$. Rise over run between those two points: $\frac{1.21-0.81}{1.1-0.9}=\frac{0.40}{0.20}=2$.

Zoom in further — use $x=0.99$ and $x=1.01$ — and the same calculation gives $2.00$ almost exactly. The curve is starting to look like a straight line with slope $2$, matching $f'(1)=2(1)=2$.

:::interactive{ref=derivatives-tangent-slope}
:::

A steep tangent line means a large derivative, a flat one means a derivative near zero, and sloping downhill means a negative derivative.

:::interactive{ref=parabola-explorer}
:::
