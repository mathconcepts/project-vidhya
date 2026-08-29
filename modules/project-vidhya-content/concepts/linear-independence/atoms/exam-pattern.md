---
id: linear-independence.exam-pattern
concept_id: linear-independence
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **It usually asks in disguise.** Linear independence rarely gets its own question — it hides inside "is $A$ invertible", "what is $\text{rank}(A)$", "is this a basis", "is $A$ diagonalizable". Recognising it is the shortcut: all of those reduce to a determinant or a rank you were going to compute anyway.

- **MCQ "which set is a basis of $\mathbb{R}^n$" — count before you compute.** A basis of $\mathbb{R}^3$ has *exactly* 3 vectors. Options with 2 or 4 are eliminated on sight, and only the survivors get a determinant.

  Example: are $v_1 = (1,2,1)$, $v_2 = (2,1,0)$, $v_3 = (5,4,1)$ a basis of $\mathbb{R}^3$? Count is right, so compute $\det\begin{pmatrix} 1&2&5\\2&1&4\\1&0&1\end{pmatrix} = 1(1) - 2(-2) + 5(-1) = 0$ (verified). Dependent — not a basis. The witness: $v_3 = v_1 + 2v_2$.

- **The trap GATE loves: pairwise independence.** $\{(1,0), (0,1), (1,1)\}$ has every *pair* independent, and the *set* is dependent — $(1,1) = (1,0) + (0,1)$. Independence is a property of the whole set at once, never of its pairs. Any option phrased "no two of them are parallel, therefore independent" is wrong.

- **Second trap: over-computing the count case.** Four vectors in $\mathbb{R}^3$ are dependent, full stop — no row reduction needed. GATE puts a plausible-looking $3 \times 4$ system in the stem precisely to see who starts reducing.

- **Beyond $\mathbb{R}^n$: functions.** For $\{f_1, \ldots, f_k\}$, a Wronskian that is non-zero at even one point proves independence. The converse fails — a Wronskian identically zero does **not** prove dependence. "$W \equiv 0 \Rightarrow$ dependent" is a standard false option.

- **Time budget:** three vectors in $\mathbb{R}^3$ is one $3\times3$ determinant, under 60 seconds. If you're solving the full homogeneous system when the question only asked *whether* the set is independent, you're answering a bigger question than the paper set — solve for the coefficients only when it asks you to exhibit the relation.
