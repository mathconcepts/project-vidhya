---
# Alternative body for cayley-hamilton.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: cayley-hamilton.hook.shaken
concept_id: cayley-hamilton
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: cayley-hamilton.hook
for_stance: shaken
---

Plug the matrix itself into its own characteristic polynomial.

For $A = \begin{pmatrix}1&1\\0&2\end{pmatrix}$: the characteristic equation is $\lambda^2-3\lambda+2=0$. Replace $\lambda$ with $A$, and $A^2-3A+2I$ comes out to the zero matrix.

Every square matrix does this to its own equation.
