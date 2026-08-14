---
id: change-of-basis.common-traps
concept_id: change-of-basis
atom_type: common_traps
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
---

# Common Traps: Change of Basis

## Trap 1: Confusing the Direction of Transformation

**The trap:** You write the change-of-basis matrix $P = [v_1 | v_2 | \cdots | v_n]$ (columns are the *new* basis vectors in standard coordinates). Then, without thinking, you compute $[x]_{\text{new}} = P[x]_{\text{old}}$.

**The truth:** If $P$ has the *new* basis vectors as columns, then $P$ actually converts *from* new basis *to* old (standard) basis. You write $[x]_E = P[x]_B$, not the other way around. To convert in the reverse direction, use $[x]_B = P^{-1}[x]_E$.

**Fix:** Always label your matrix clearly: $P_{B \to E}$ (columns are $B$ basis vectors in $E$ coordinates) sends you from $B$ coordinates to $E$ coordinates.

---

## Trap 2: Forgetting to Invert

**The trap:** You need to find coordinates in the *new* basis, so you write $[x]_{\text{new}} = P[x]_{\text{old}}$ without realizing $P$ goes the opposite direction.

**The truth:** If $P$ has new basis vectors as columns, it satisfies $[x]_E = P[x]_B$. To find $[x]_B$ from $[x]_E$, you *must* invert: $[x]_B = P^{-1}[x]_E$.

**Fix:** Write out the formula before multiplying. Be explicit: "I have $[x]_E$ and want $[x]_B$, so I compute $P^{-1}[x]_E$."

---

## Trap 3: Matrix Multiplication Order

**The trap:** Coordinates are *column* vectors. Writing $[x]_B P$ (vector on the left, matrix on the right) is not defined in standard linear algebra and gives nonsense.

**The truth:** Matrix multiplication of a matrix times a vector is always: matrix first, vector second, like $P[x]_B$.

**Fix:** Never write $[x]_B P$. Always write $P[x]_B$ or $P^{-1}[x]_E$.

---

## Trap 4: Singular Matrix (Not a Basis)

**The trap:** You're given vectors $v_1, v_2, v_3$ and told to form a change-of-basis matrix. You write $P = [v_1 | v_2 | v_3]$ and try to invert it, only to discover $\det(P) = 0$.

**The truth:** If the vectors are *linearly dependent*, they do not form a basis, and $P$ is singular (non-invertible). You cannot use the change-of-basis formula.

**Fix:** Before forming $P$, verify that the vectors are linearly independent (e.g., check that $\det(P) \neq 0$). If they're not independent, they're not a valid basis.