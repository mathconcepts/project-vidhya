---
# Alternative body for cayley-hamilton.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: cayley-hamilton.intuition.shaken
concept_id: cayley-hamilton
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: cayley-hamilton.intuition
for_stance: shaken
---

## Try it on one matrix

Take $A = \begin{pmatrix}1&1\\0&2\end{pmatrix}$. Its characteristic polynomial is $p(\lambda) = \lambda^2-3\lambda+2$.

Substitute $A$ for $\lambda$: $p(A) = A^2-3A+2I$. Since $A^2=\begin{pmatrix}1&3\\0&4\end{pmatrix}$,

$$p(A) = \begin{pmatrix}1&3\\0&4\end{pmatrix} - 3\begin{pmatrix}1&1\\0&2\end{pmatrix} + 2\begin{pmatrix}1&0\\0&1\end{pmatrix} = \begin{pmatrix}0&0\\0&0\end{pmatrix}$$

Zero — and this happens for every square matrix, not just this one.

## What it buys you

Rearrange $A^2 = 3A - 2I$, and every higher power of $A$ reduces to just $A$ and $I$. No need to ever multiply $A$ by itself five times.

The same rearrangement, solved the other way, hands you $A^{-1}$ with no cofactors and no determinant expansion.
