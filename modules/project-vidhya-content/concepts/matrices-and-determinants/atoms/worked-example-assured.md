---
id: matrices-and-determinants.worked-example-assured
concept_id: matrices-and-determinants
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
variant_of: matrices-and-determinants.worked-example
for_stance: assured
scaffold_fade: true
---

**Problem:** Solve using Cramer's rule: $x+y+z=6$, $x-y+z=2$, $x+2y-z=2$.

$\Delta=4$, $\Delta_x=4$, $\Delta_y=8$, $\Delta_z=12$ (row-1 expansion each time), so $x=1,\ y=2,\ z=3$. Check: all three equations balance.

**The genuine time-saver here is row reduction on $[A\mid b]$ once, not four separate cofactor expansions.** Cramer's rule is elegant on paper but computes $\Delta,\Delta_x,\Delta_y,\Delta_z$ from scratch — four full $3\times3$ determinants. Row-reducing the augmented matrix $[A\mid b]$ ONCE and back-substituting gets the same answer with a fraction of the arithmetic, and it also reveals rank directly should the system prove singular, which Cramer's rule alone never tells you. Reach for Cramer's rule specifically when the question wants only a SINGLE unknown out of the three (say, just $z$) — then only $\Delta$ and $\Delta_z$ need computing, and row reduction's advantage (finding all three at once) stops mattering.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving a 3x3 system with Cramer's rule","steps":[{"prompt":"Before using Cramer's rule on x+y+z=6, x-y+z=2, x+2y-z=2, what must you check first, and why?","hint":"Cramer's rule needs a fraction Delta_x/Delta. What must be true of the denominator?","answer":"Compute Delta = det(A) first. If Delta = 0, Cramer's rule cannot give a unique solution this way, and you would need to check consistency separately. Here Delta = 4, which is nonzero, so a unique solution exists."},{"prompt":"How is Delta_x built from the original coefficient matrix A?","hint":"Only one column of A changes to form Delta_x.","answer":"Delta_x is det(A) with the x-column (the first column) replaced by the right-hand side vector b = (6, 2, 2). The y-column and z-column stay exactly as in A."},{"prompt":"Given Delta=4, Delta_x=4, Delta_y=8, Delta_z=12, what is the solution (x, y, z)?","hint":"Each unknown is its own determinant divided by Delta.","answer":"x = Delta_x/Delta = 4/4 = 1. y = Delta_y/Delta = 8/4 = 2. z = Delta_z/Delta = 12/4 = 3."}]}
```
