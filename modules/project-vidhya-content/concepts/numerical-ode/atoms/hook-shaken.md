---
# Alternative body for numerical-ode.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-ode.hook.shaken
concept_id: numerical-ode
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: numerical-ode.hook
for_stance: shaken
---

$\frac{dy}{dt}=-2y$, $y(0)=1$. You don't need the formula for $y(t)$ to take one step: the slope right now is $-2\times1=-2$. Move forward by $h=0.1$ along that slope: $y(0.1)\approx1+0.1\times(-2)=0.8$. One slope, one small step, one new value — that step, repeated, is the entire method.
