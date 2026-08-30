---
# Alternative body for inverse-laplace.hook, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: inverse-laplace.hook.shaken
concept_id: inverse-laplace
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: inverse-laplace.hook
for_stance: shaken
---

Take $F(s)=\dfrac{1}{s+3}$. Match its shape to the table entry $\dfrac{1}{s+a}\to e^{-at}$ with $a=3$:

$$f(t)=e^{-3t}$$

No partial fractions were even needed — the whole job here was matching the shape.
