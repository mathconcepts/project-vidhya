---
id: lu-factorization.exam-pattern
concept_id: lu-factorization
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
modality: text
exam_ids: ["*"]
---

**How GATE actually asks this.**

- **NAT questions usually want one entry, not the whole factorization.** "Find $u_{22}$" or "find $\ell_{21}$" — compute only the elimination steps that reach that entry and stop. For $A=\begin{pmatrix}2&1\\6&8\end{pmatrix}$: $\ell_{21}=6/2=3$ and $u_{22}=8-3(1)=5$, two lines of work, not four.

- **State the convention before computing.** Doolittle fixes $L$'s diagonal at 1, Crout fixes $U$'s — the same $A$ gives *different* correct numeric answers under the two conventions. GATE's stem names one; answering under the other loses the mark on otherwise-correct arithmetic.

- **The determinant shortcut is sometimes the real question.** "Using LU, find $\det A$" reduces to multiplying $U$'s diagonal, since $\det L=1$. If the factorization needed a row swap, it's $PA=LU$ and $\det A=(-1)^{s}\prod u_{ii}$ for $s$ swaps — dropping the sign is the single most common loss here.

- **Existence questions test the minors, not intuition.** LU exists without pivoting iff every leading principal minor is nonzero. The stock counterexample is $\begin{pmatrix}0&1\\1&0\end{pmatrix}$: invertible, yet no LU, because the first pivot is 0.

- **Time budget:** a $2\times2$ or $3\times3$ factorization with a single requested entry should cost under 60 seconds. If you're inverting a matrix to answer an LU question, you've misread the stem.
