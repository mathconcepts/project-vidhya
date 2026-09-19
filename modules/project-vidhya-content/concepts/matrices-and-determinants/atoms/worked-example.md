---
id: matrices-and-determinants.worked-example
concept_id: matrices-and-determinants
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Solve using Cramer's rule: $x+y+z=6$, $x-y+z=2$, $x+2y-z=2$.

---

**Step 1 — Write the coefficient matrix and compute $\Delta$.**

$$A=\begin{pmatrix}1&1&1\\1&-1&1\\1&2&-1\end{pmatrix}$$

Expanding along row 1:

$$\Delta=1\begin{vmatrix}-1&1\\2&-1\end{vmatrix}-1\begin{vmatrix}1&1\\1&-1\end{vmatrix}+1\begin{vmatrix}1&-1\\1&2\end{vmatrix}=1(1-2)-1(-1-1)+1(2+1)=-1+2+3=4$$

Since $\Delta=4\neq0$, a unique solution exists — proceed with Cramer's rule.

---

**Step 2 — Replace the $x$-column with $b=(6,2,2)$ to get $\Delta_x$.**

$$\Delta_x=\begin{vmatrix}6&1&1\\2&-1&1\\2&2&-1\end{vmatrix}=6(1-2)-1(-2-2)+1(4+2)=-6+4+6=4$$

---

**Step 3 — Replace the $y$-column, then the $z$-column, the same way.**

$$\Delta_y=\begin{vmatrix}1&6&1\\1&2&1\\1&2&-1\end{vmatrix}=1(-2-2)-6(-1-1)+1(2-2)=-4+12+0=8$$

$$\Delta_z=\begin{vmatrix}1&1&6\\1&-1&2\\1&2&2\end{vmatrix}=1(-2-4)-1(2-2)+6(2+1)=-6-0+18=12$$

---

**Step 4 — Divide each by $\Delta$.**

$$x=\frac{\Delta_x}{\Delta}=\frac44=1,\qquad y=\frac{\Delta_y}{\Delta}=\frac84=2,\qquad z=\frac{\Delta_z}{\Delta}=\frac{12}{4}=3$$

$$\boxed{x=1,\ y=2,\ z=3}$$

**Check:** $1+2+3=6$ ✓; $1-2+3=2$ ✓; $1+2(2)-3=2$ ✓.

**JEE tip.** Only the numerator changes across $\Delta_x,\Delta_y,\Delta_z$ — the column being replaced. $\Delta$ itself is computed once and reused three times; recomputing it from scratch each time wastes time under exam pressure.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving a 3x3 system with Cramer's rule","steps":[{"prompt":"Before using Cramer's rule on x+y+z=6, x-y+z=2, x+2y-z=2, what must you check first, and why?","hint":"Cramer's rule needs a fraction Delta_x/Delta. What must be true of the denominator?","answer":"Compute Delta = det(A) first. If Delta = 0, Cramer's rule cannot give a unique solution this way, and you would need to check consistency separately. Here Delta = 4, which is nonzero, so a unique solution exists."},{"prompt":"How is Delta_x built from the original coefficient matrix A?","hint":"Only one column of A changes to form Delta_x.","answer":"Delta_x is det(A) with the x-column (the first column) replaced by the right-hand side vector b = (6, 2, 2). The y-column and z-column stay exactly as in A."},{"prompt":"Given Delta=4, Delta_x=4, Delta_y=8, Delta_z=12, what is the solution (x, y, z)?","hint":"Each unknown is its own determinant divided by Delta.","answer":"x = Delta_x/Delta = 4/4 = 1. y = Delta_y/Delta = 8/4 = 2. z = Delta_z/Delta = 12/4 = 3."}]}
```
