---
# Alternative body for numerical-ode.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-ode.intuition.shaken
concept_id: numerical-ode
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: numerical-ode.intuition
for_stance: shaken
---

## One step, before the general rule

$\frac{dy}{dt}=-2y$, $y(0)=1$, step $h=0.1$. The slope right now is $f(0,1)=-2(1)=-2$. Move forward using only that slope:

$$y_1=y_0+h\cdot f(t_0,y_0)=1+0.1(-2)=0.8$$

One number in, one slope computed, one new number out. Repeat at the new point $t_1=0.1,\,y_1=0.8$: slope $f(0.1,0.8)=-2(0.8)=-1.6$, so $y_2=0.8+0.1(-1.6)=0.64$.

That is Euler's method, in full: at each point, use the equation to find the slope, take a small step along it, land at a new point, repeat. RK4 improves on this by checking the slope a few more times *within* each step before committing to a direction — more work per step, a much smaller error.
