---
id: greens-theorem.common-traps
concept_id: greens-theorem
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Wrong orientation of C**: Green's Theorem requires $C$ to be traversed **counterclockwise** (positive orientation). If the problem specifies clockwise, either reverse it (flipping the sign) or recompute. A clockwise circle negates the integral.

- **Confusing which partial derivative goes where**: The formula is $\frac{\partial Q}{\partial x} - \frac{\partial P}{\partial y}$, not the reverse. Reversing the subtraction flips the sign of the answer—a common 1-mark mistake.

- **Forgetting to compute the area**: Many GATE problems give a closed region (circle, ellipse, triangle) and ask to "evaluate $\oint_C P \, dx + Q \, dy$" expecting you to use Green's Theorem. A novice tries to parameterize the curve; an expert recognizes "closed curve" and immediately computes the double integral of curl over the enclosed region.
