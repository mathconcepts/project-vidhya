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
difficulty: 0
exam_ids: ["*"]
variant_of: numerical-ode.hook
for_stance: shaken
---

$\frac{dy}{dx}=x^2+y^2$ with $y(0)=1$ cannot be written using ordinary functions. Take one small step anyway: the slope at the start is $0^2+1^2=1$, so with step size $0.1$, $y$ moves to $1+0.1(1)=1.1$. Repeat that same small step over and over and a curve with no formula becomes a table of numbers.
