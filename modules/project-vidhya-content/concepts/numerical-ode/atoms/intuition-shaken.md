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
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-ode.intuition
for_stance: shaken
---

## One step, before the name

$\frac{dy}{dx}=x^2+y^2$ with $y(0)=1$ has no solution expressible in ordinary functions. Take one step of size $h=0.1$ anyway: the slope at the start is $f(0,1)=0^2+1^2=1$, so

$$y_1=y_0+h\cdot f(0,1)=1+0.1(1)=1.1$$

One number, computed from the slope at a single point, standing in for a curve with no formula behind it.

Euler's method just repeats that same move: use the slope where you are, take a small step $h$ in that direction, land at a new point, find the new slope, repeat. A smaller $h$ hugs the true, unknown curve more closely, at the cost of needing more steps to cover the same distance — accuracy traded for computation, every time.
