---
id: cayley-hamilton.mnemonic
concept_id: cayley-hamilton
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Every matrix is a root of its own equation."** That one sentence is the whole theorem. The characteristic polynomial was built to have the *eigenvalues* as roots — Cayley-Hamilton says the *matrix itself* is a root too, once you read $\lambda^k$ as $A^k$ and the constant term as $c_0 I$.

**The 2×2 form worth memorising outright:**

$$A^2 = \text{tr}(A)\, A - \det(A)\, I$$

That is $p(\lambda) = \lambda^2 - \text{tr}(A)\lambda + \det(A)$ with $A$ substituted. You never need to expand $\det(\lambda I - A)$ for a $2\times2$ — read the trace, read the determinant, done.

**And the inverse falls straight out of it:**

$$A^{-1} = \frac{1}{\det(A)}\big(\text{tr}(A)\, I - A\big)$$

For $A = \begin{pmatrix} 1 & 1 \\ 0 & 2 \end{pmatrix}$: $\text{tr}(A)=3$, $\det(A)=2$, so $A^{-1} = \frac{1}{2}(3I - A)$ — the same answer the adjugate method gives, in one line.

**Watch the constant term.** The $I$ is not optional and not a $1$. Writing $A^2 - 3A + 2 = 0$ instead of $A^2 - 3A + 2I = 0$ mixes a scalar into a matrix equation — it is the single most common slip on this theorem.
