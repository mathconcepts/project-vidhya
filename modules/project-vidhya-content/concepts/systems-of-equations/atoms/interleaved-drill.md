---
id: systems-of-equations.interleaved-drill
concept_id: systems-of-equations
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: systems-of-equations.micro-exercise
---

**Cross-concept check: systems of equations → rank–nullity.**

$$A = \begin{pmatrix} 1 & 2 & 3 \\ 2 & 4 & 6 \\ 1 & 1 & 1 \end{pmatrix}, \qquad b = \begin{pmatrix} 1 \\ 2 \\ 0 \end{pmatrix}$$

**Question 1 (predict before solving):** Row 2 is exactly $2 \times$ row 1. Using ranks alone, how many solutions does $Ax = b$ have — and how many free parameters?

*Answer:* $\text{rank}(A) = 2$: rows $1$ and $3$ are independent, row $2$ is redundant (verified: $\text{rank}(A) = 2$). Now the augmented matrix — the doubling holds on the right-hand side too ($b_2 = 2b_1$), so appending $b$ adds no new independent row: $\text{rank}([A \mid b]) = 2$ (verified). Ranks **agree**, so the system is consistent; and $2 < n = 3$, so it is **short** — infinitely many solutions.

Rank–nullity supplies the count directly: $\text{nullity}(A) = n - \text{rank}(A) = 3 - 2 = 1$, so the solution set is a **line**: one particular solution plus a one-parameter family. (Explicitly: $y = -1 - 2x$, $z = 1 + x$, with $x$ free.) Not one row operation was carried to completion.

**Question 2 (change only $b$):** Replace $b$ with $b' = (1, 3, 0)^T$. Does the answer change? Does $\text{nullity}(A)$ change?

*Answer:* The system changes completely; the nullity does not. Now $b'_2 = 3 \neq 2 = 2b'_1$, so appending $b'$ introduces a genuinely new independent row: $\text{rank}([A \mid b']) = 3$ while $\text{rank}(A)$ is still $2$ (verified). Ranks **disagree** $\Rightarrow$ **no solution**. Row-reducing would surface the contradiction $0 = 1$.

Meanwhile $\text{nullity}(A) = 1$ regardless — the null space depends on $A$ alone, and $b$ never enters rank–nullity. What $b$ controls is whether the solution set is *empty* or a *shifted copy* of that null space.

**Why this drill exists:** students compute $\text{rank}(A)$, see it is less than $n$, and answer "infinitely many" without ever forming $[A \mid b]$. Nullity tells you the *size* of the solution set if one exists; only the comparison $\text{rank}(A)$ vs $\text{rank}([A\mid b])$ tells you whether it exists at all. The two matrices here have identical $A$ and opposite answers.
