---
id: jordan-normal-form.exam-pattern
concept_id: jordan-normal-form
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **GATE almost never wants $P$.** It asks for the Jordan form itself, the minimal polynomial, or the *number* of Jordan blocks. All three come from **ranks**, not from solving for generalized eigenvectors. Chasing $P$ on a NAT question is the single biggest time sink in this topic.

  Example: $A = \begin{pmatrix} 3 & 0 & 0 \\ 0 & 3 & 1 \\ 0 & 0 & 3 \end{pmatrix}$. Then $A - 3I = \begin{pmatrix} 0&0&0\\0&0&1\\0&0&0 \end{pmatrix}$ has rank 1, so the number of blocks is $3 - 1 = 2$; their sizes must add to the algebraic multiplicity 3, giving $\{2, 1\}$; hence $m_A(x) = (x-3)^2$. Three answers, one rank computation, no eigenvectors.

- **The signature MCQ: "char poly $= p$, min poly $= m$ — which Jordan form?"** The trap is that this data does **not** always determine $J$. It does for $n \leq 3$; it fails first at $n = 4$: characteristic $(x-2)^4$ with minimal $(x-2)^2$ admits block sizes $\{2,2\}$ **and** $\{2,1,1\}$. When both appear as options, "cannot be determined from the given information" is the answer — GATE sets this deliberately.

- **NAT pattern: nilpotent index.** For $N = A - \lambda I$ on a single eigenvalue, the smallest $k$ with $N^k = 0$ *is* the largest block size. Powering a small $N$ is faster than any other route.

- **The trap: reading the $1$s as part of the eigenvalue count.** The superdiagonal entries are structural, not spectral. $\text{tr}(J) = \text{tr}(A)$ and $\det(J) = \det(A)$ still hold, and both ignore the ones — useful as a check on an assembled $J$.

- **Second trap: assuming a repeated eigenvalue forces a nontrivial block.** $\lambda$ repeated with full geometric multiplicity gives $1 \times 1$ blocks only — that's a diagonalizable matrix, and $J = D$.

- **Time budget:** blocks-and-minimal-polynomial from ranks should cost under 2 minutes for a $3\times3$ or $4\times4$. If you are row-reducing to find a generalized eigenvector on a question that only asked for $m_A(x)$, stop — you've answered a harder question than the one on the paper.
