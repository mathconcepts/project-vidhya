---
# Alternative body for diagonalization-worked-example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence.
# The prose is held at or below the base atom's length — a screen visibly
# longer than the one that already defeated this reader signals difficulty
# no matter how kindly it is written. No praise, no reassurance, and no
# mention of how the reader might be feeling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: diagonalization.worked-example.shaken
concept_id: diagonalization
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: diagonalization-worked-example
for_stance: shaken
---

## Diagonalize $A = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$

Four steps, same order every time.

---

## Step 1 — Eigenvalues

$$(4-\lambda)(3-\lambda) - (1)(2) = \lambda^2 - 7\lambda + 10 = (\lambda-5)(\lambda-2)$$

$$\boxed{\lambda_1 = 5, \quad \lambda_2 = 2}$$

Two distinct eigenvalues — diagonalizable, guaranteed.

---

## Step 2 — Eigenvectors

For $\lambda_1 = 5$: $(A-5I)\mathbf{v}=\mathbf{0} \Rightarrow -v_1+v_2=0 \Rightarrow \mathbf{v}_1 = \begin{pmatrix} 1 \\ 1 \end{pmatrix}$

For $\lambda_2 = 2$: $(A-2I)\mathbf{v}=\mathbf{0} \Rightarrow 2v_1+v_2=0 \Rightarrow \mathbf{v}_2 = \begin{pmatrix} 1 \\ -2 \end{pmatrix}$

---

## Step 3 — Build $P$ and $D$

$$P = \begin{pmatrix} 1 & 1 \\ 1 & -2 \end{pmatrix}, \qquad D = \begin{pmatrix} 5 & 0 \\ 0 & 2 \end{pmatrix}$$

Column order matters: column $i$ of $P$ must match diagonal entry $i$ of $D$.

---

## Step 4 — Check

$$P^{-1} = \frac{1}{-3}\begin{pmatrix} -2 & -1 \\ -1 & 1 \end{pmatrix} = \begin{pmatrix} 2/3 & 1/3 \\ 1/3 & -1/3 \end{pmatrix}$$

Multiply back: $PDP^{-1} = \begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix} = A$ ✓

---

## Bonus: $A^3$ for free

$$A^3 = PD^3P^{-1}, \qquad D^3 = \begin{pmatrix} 125 & 0 \\ 0 & 8 \end{pmatrix}$$

Three scalar cubes instead of two matrix multiplications.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: diagonalizing A = [[4,1],[2,3]] to find A^10","steps":[{"prompt":"What is the characteristic polynomial of $A = \\\\begin{pmatrix}4&1\\\\\\\\2&3\\\\end{pmatrix}$?","hint":"Expand $\\\\det(A - \\\\lambda I) = (4-\\\\lambda)(3-\\\\lambda) - 2$.","answer":"$\\\\lambda^2 - 7\\\\lambda + 10 = 0$, giving eigenvalues $\\\\lambda = 5$ and $\\\\lambda = 2$."},{"prompt":"Find the eigenvector for $\\\\lambda = 2$. Solve $(A - 2I)\\\\mathbf{v} = \\\\mathbf{0}$.","hint":"Row reduce $\\\\begin{pmatrix}2&1\\\\\\\\2&1\\\\end{pmatrix}$. The single equation is $2v_1 + v_2 = 0$.","answer":"$v_2 = -2v_1$, so $\\\\mathbf{v}_2 = \\\\begin{pmatrix}1\\\\\\\\-2\\\\end{pmatrix}$ (or any scalar multiple)."},{"prompt":"Write down $P$ and $D$, then state $A^{10}$ in terms of $P$, $D$, and $P^{-1}$.","hint":"$P$ has eigenvectors as columns; $D$ has the matching eigenvalues on the diagonal. Use $A^k = PD^kP^{-1}$.","answer":"$P = \\\\begin{pmatrix}1&1\\\\\\\\1&-2\\\\end{pmatrix}$, $D = \\\\begin{pmatrix}5&0\\\\\\\\0&2\\\\end{pmatrix}$, so $A^{10} = P\\\\begin{pmatrix}5^{10}&0\\\\\\\\0&2^{10}\\\\end{pmatrix}P^{-1}$."}]}
```
