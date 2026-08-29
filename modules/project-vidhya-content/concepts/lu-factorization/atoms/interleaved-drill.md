---
id: lu-factorization.interleaved-drill
concept_id: lu-factorization
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: lu-factorization.micro_exercise
---

**Cross-concept check: LU factorization → determinants.**

$A = \begin{pmatrix} 2 & -1 & 0 \\ 4 & 3 & 1 \\ 2 & 1 & 3 \end{pmatrix}$ factors (Doolittle) as

$$L = \begin{pmatrix} 1 & 0 & 0 \\ 2 & 1 & 0 \\ 1 & 2/5 & 1 \end{pmatrix}, \quad U = \begin{pmatrix} 2 & -1 & 0 \\ 0 & 5 & 1 \\ 0 & 0 & 13/5 \end{pmatrix}$$

(verified: $LU = A$ exactly.)

**Question 1 (LU → determinants):** Without expanding a single cofactor, what is $\det A$?

*Answer:* $\det(LU) = \det L \cdot \det U$. Both factors are triangular, so each determinant is its diagonal product. $L$ is *unit* lower triangular, so $\det L = 1 \cdot 1 \cdot 1 = 1$. Therefore

$$\det A = \det U = 2 \cdot 5 \cdot \tfrac{13}{5} = 26$$

The fraction cancels — that is normal, not a red flag. $\det A$ must be an integer here because $A$ has integer entries, even though $U$ does not.

**Question 2 (determinants → LU):** Cofactor-expand $\det A$ along the first row as an independent check. Then: if solving $Ax = b$ had required swapping rows 1 and 2 before eliminating, what would change?

*Answer:* Along row 1, $\det A = 2(3\cdot3 - 1\cdot1) - (-1)(4\cdot3 - 1\cdot2) + 0 = 2(8) + 1(10) = 26$ ✓ — same answer, roughly triple the arithmetic.

With one row swap you no longer factor $A$; you factor $PA = LU$. Since $\det P = -1$ for a single swap, $\det A = (-1)^{1}\prod u_{ii}$. The diagonal product of $U$ is then $-26$, and dropping the sign gives exactly the wrong answer with entirely correct elimination.

**Why this drill exists:** students reliably compute $L$ and $U$ correctly and then reach for cofactor expansion anyway, because "determinant" and "factorization" are stored as separate procedures. They are the same computation — $U$'s diagonal *is* the determinant, up to the sign of the permutation. This drill targets the missing link, and the sign trap that punishes anyone who finds it half-way.
