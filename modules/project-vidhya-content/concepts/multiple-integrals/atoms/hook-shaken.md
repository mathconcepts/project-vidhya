---
# Alternative body for multiple-integrals.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: multiple-integrals.hook.shaken
concept_id: multiple-integrals
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: multiple-integrals.hook
for_stance: shaken
---

Take $f(x,y)=1$ over the rectangle $0\le x\le2,\,0\le y\le3$. Stack a height of $1$ over every point: the volume is just the base area, $2\times3=6$. As a double integral: $\int_0^2\int_0^3 1\,dy\,dx=\int_0^2 3\,dx=6$. Same number, reached by summing area elements instead of measuring a box directly.
