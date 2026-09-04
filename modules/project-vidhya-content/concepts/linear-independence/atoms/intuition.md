---
id: linear-independence.intuition
concept_id: linear-independence
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
---

Look back at the matrix from the hook: $A=\begin{pmatrix}1&1\\0&2\end{pmatrix}$. Its two columns are $v_1=(1,0)$ and $v_2=(1,2)$. No number $c$ can turn $v_1$ into $v_2$ by scaling alone — $c\times(1,0)=(c,0)$ can never equal $(1,2)$, since the second entry would need to become $2$ from $0$ no matter what $c$ is. That is what **linearly independent** means: neither column is a stretched (or shrunk) copy of the other.

Now look at the "ghost" matrix from the same hook, $\begin{pmatrix}1&1\\2&2\end{pmatrix}$. Both of its columns are the exact same vector, $(1,2)$ — one is just $1\times$ the other. That is **linearly dependent**: the second column adds nothing new, because it can be built from the first by scaling alone.

The determinant gives the same answer without drawing anything: $\det(A)=1\times2-1\times0=2\neq0$ confirms $A$'s columns are independent, while $\det(\text{ghost})=1\times2-1\times2=0$ confirms the ghost's are dependent. In $\mathbb{R}^n$, a set of vectors is independent exactly when no vector in it can be built as a **linear combination** (a sum of scaled copies) of the others. This matters because only an independent set can form a **basis** — the smallest collection of directions needed to reach every point in the space.