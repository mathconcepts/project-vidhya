---
# Alternative body for residue-calculus.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
id: residue-calculus.hook.shaken
concept_id: residue-calculus
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: residue-calculus.hook
for_stance: shaken
---

Take $\oint_{|z|=2}\frac{dz}{z(z-1)}$: two poles inside, residues $-1$ at $z=0$ and $1$ at $z=1$ — found in seconds, not by tracing the whole loop. Sum them: $0$. Multiply by $2\pi i$: the integral is $0$, the whole loop reduced to two numbers.
