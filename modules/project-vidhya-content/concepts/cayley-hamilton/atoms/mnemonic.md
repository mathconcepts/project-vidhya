---
id: cayley-hamilton.mnemonic
concept_id: cayley-hamilton
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Every matrix is a root of its own equation."** That sentence is the whole theorem. Swap $\lambda^k \to A^k$ and the constant term $\to$ (constant)$\times I$, and the matrix satisfies it too.

**The 2×2 shortcut worth memorising outright:**

$$A^2 = \text{tr}(A)\, A - \det(A)\, I$$

Here $\text{tr}(A)$ ("trace") just means add the two diagonal entries; $\det(A)$ is the usual determinant, $ad-bc$. Read those two numbers off $A$ directly — no need to expand $\det(\lambda I - A)$ first.

**And the inverse falls straight out of it:**

$$A^{-1} = \frac{1}{\det(A)}\big(\text{tr}(A)\, I - A\big)$$

For $A = \begin{pmatrix} 1 & 1 \\ 0 & 2 \end{pmatrix}$: trace $=3$, determinant $=2$, so $A^{-1} = \frac{1}{2}(3I - A)$ — one line, no cofactor grid to build first.

**Watch the constant term.** The $I$ is not optional and not a bare $1$. Writing $A^2 - 3A + 2 = 0$ instead of $A^2 - 3A + 2I = 0$ mixes a scalar into a matrix equation — the single most common slip on this theorem.
