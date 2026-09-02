---
id: rank-nullity.interleaved-drill
concept_id: rank-nullity
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: rank-nullity.micro-exercise
---

**Cross-concept check: rank-nullity → systems of equations.**

Reuse $A = \begin{pmatrix} 1 & 2 & 3 \\ 2 & 4 & 6 \\ 1 & 2 & 3 \end{pmatrix}$ from the worked example: $\text{rank}(A) = 1$, so $\text{nullity}(A) = 3-1 = 2$.

**Question 1 (rank-nullity):** Nullity 2 means a 2-parameter family of solutions. Does it follow that $A\mathbf{x}=\mathbf{b}$ has infinitely many solutions for *every* $\mathbf{b}\in\mathbb{R}^3$?

*Answer:* **No.** Nullity describes only the *homogeneous* system $A\mathbf{x}=\mathbf{0}$. **If** a solution to $A\mathbf{x}=\mathbf{b}$ exists, the full solution set is that particular solution translated by the 2-dimensional null space. Whether one exists at all is separate, decided by $\text{rank}(A)$ vs $\text{rank}([A\mid\mathbf{b}])$.

**Question 2 (systems of equations):** Decide solvability for $\mathbf{b}_1=(1,2,1)^T$ and $\mathbf{b}_2=(1,2,3)^T$.

*Answer:* For $\mathbf{b}_1$: in $[A\mid\mathbf{b}_1]$, row 2 is exactly $2\times$ row 1 and row 3 equals row 1, so $\text{rank}([A\mid\mathbf{b}_1])=1=\text{rank}(A)$. **Consistent** — infinitely many solutions; $\mathbf{x}=(1,0,0)^T$ is one (check: $A(1,0,0)^T=(1,2,1)^T$ ✓).

For $\mathbf{b}_2$: $R_3-R_1$ turns the last row into $(0,0,0\mid2)$ — the equation $0=2$. $\text{rank}([A\mid\mathbf{b}_2])=2>1=\text{rank}(A)$. **Inconsistent: no solution at all.**

Same $A$, same rank, same nullity 2 — opposite verdicts, decided entirely by $\mathbf{b}$.

**Why this drill exists:** the misconception is "nullity $>0$ $\Rightarrow$ infinitely many solutions." Rank-nullity is a statement about $A$ alone and can never see $\mathbf{b}$. Rank governs *how many* solutions there are once you have one; the augmented rank governs *whether* you have one.
