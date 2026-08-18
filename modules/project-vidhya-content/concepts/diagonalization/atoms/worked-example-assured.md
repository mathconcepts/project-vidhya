---
# Alternative body for diagonalization-worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: diagonalization.worked-example.assured
concept_id: diagonalization
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: diagonalization-worked-example
for_stance: assured
---

## $A = PDP^{-1}$ for $\begin{pmatrix} 4 & 1 \\ 2 & 3 \end{pmatrix}$

$\operatorname{tr}(A)=7$, $\det(A)=10$ give $\lambda^2-7\lambda+10=0$ directly — $\lambda = 5, 2$ without ever forming $A-\lambda I$.

Eigenvectors: $(1,1)$ for $\lambda=5$, $(1,-2)$ for $\lambda=2$. Column order in $P$ must match the diagonal order in $D$ — that pairing, not the algebra, is where this problem type is actually lost.

$$A^k = PD^kP^{-1}$$

For $k=3$: cube $5$ and $2$, and don't touch $P$ or $P^{-1}$ again. That substitution is the entire payoff of doing this problem at all.

---

**Worth knowing:** with a repeated eigenvalue, none of this goes through until geometric multiplicity has been checked separately — distinct eigenvalues is what makes this instance easy, not typical of the type.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: diagonalizing A = [[4,1],[2,3]] to find A^10","steps":[{"prompt":"What is the characteristic polynomial of $A = \\\\begin{pmatrix}4&1\\\\\\\\2&3\\\\end{pmatrix}$?","hint":"Expand $\\\\det(A - \\\\lambda I) = (4-\\\\lambda)(3-\\\\lambda) - 2$.","answer":"$\\\\lambda^2 - 7\\\\lambda + 10 = 0$, giving eigenvalues $\\\\lambda = 5$ and $\\\\lambda = 2$."},{"prompt":"Find the eigenvector for $\\\\lambda = 2$. Solve $(A - 2I)\\\\mathbf{v} = \\\\mathbf{0}$.","hint":"Row reduce $\\\\begin{pmatrix}2&1\\\\\\\\2&1\\\\end{pmatrix}$. The single equation is $2v_1 + v_2 = 0$.","answer":"$v_2 = -2v_1$, so $\\\\mathbf{v}_2 = \\\\begin{pmatrix}1\\\\\\\\-2\\\\end{pmatrix}$ (or any scalar multiple)."},{"prompt":"Write down $P$ and $D$, then state $A^{10}$ in terms of $P$, $D$, and $P^{-1}$.","hint":"$P$ has eigenvectors as columns; $D$ has the matching eigenvalues on the diagonal. Use $A^k = PD^kP^{-1}$.","answer":"$P = \\\\begin{pmatrix}1&1\\\\\\\\1&-2\\\\end{pmatrix}$, $D = \\\\begin{pmatrix}5&0\\\\\\\\0&2\\\\end{pmatrix}$, so $A^{10} = P\\\\begin{pmatrix}5^{10}&0\\\\\\\\0&2^{10}\\\\end{pmatrix}P^{-1}$."}]}
```
