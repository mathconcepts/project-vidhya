---
# Alternative body for ode-exact.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: ode-exact.hook.shaken
concept_id: ode-exact
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: ode-exact.hook
for_stance: shaken
---

Take $(2xy+3x^2)\,dx+(x^2+4y^3)\,dy=0$. There is a function $F(x,y)=x^2y+x^3+y^4$ whose level curves $F=C$ are exactly its solutions — no separating, no integrating factor, just uncovering $F$.
