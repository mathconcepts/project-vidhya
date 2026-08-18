---
# Alternative body for gram-schmidt.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: gram-schmidt.intuition.shaken
concept_id: gram-schmidt
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: gram-schmidt.intuition
for_stance: shaken
---

Take $v_1=(1,0)$ and $v_2=(1,1)$. Not perpendicular — $v_2$ leans partly along $v_1$.

Normalize $v_1$ first: $e_1 = (1,0)$, already length $1$.

Now find how much of $v_2$ points along $e_1$: that's $\langle v_2,e_1\rangle = 1$. Subtract it off: $v_2 - 1\cdot e_1 = (1,1)-(1,0) = (0,1)$.

Check: is $(0,1)$ perpendicular to $(1,0)$? $\langle (0,1),(1,0)\rangle = 0$. Yes.

Normalize: $(0,1)$ is already length $1$, so $e_2=(0,1)$.

$\{e_1,e_2\}$ is orthonormal — perpendicular, unit length, same span as $\{v_1,v_2\}$. Each new vector only ever loses the part pointing along the ones already built.
