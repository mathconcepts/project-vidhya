---
id: greens-theorem.exam_pattern
concept_id: greens-theorem
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.6
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want one evaluated number from a closed-curve line integral.** The moment the curve is described as closed (a circle, an ellipse, the boundary of a region), converting to $\iint_D(\partial_xQ-\partial_yP)\,dA$ is faster than parametrizing every piece of $C$ by hand.

  Example: $\oint_C y\,dx+4x\,dy$ over the unit circle (counterclockwise) has density $\partial_x(4x)-\partial_y(y)=4-1=3$, so the integral is $3\cdot\pi(1)^2=3\pi$ — read off in two lines, no parametrization needed.

- **MCQ "which form applies" questions test recognizing that $C$ is simple and closed**, not computation. If $C$ self-intersects or isn't closed, Green's Theorem doesn't apply at all — that is the distractor, not a sign error hiding in the arithmetic.

- **MSQ "true or false" stems mix orientation and formula-order facts**: reversing $C$'s direction flips the sign; swapping $P$ and $Q$ inside the formula (using $\partial_xP-\partial_yQ$ instead) also flips it, for a different reason — worth checking as two separate statements, not one.

- **Time budget:** with $P,Q$ given as polynomials, the two partial derivatives and an area lookup should finish under 90 seconds; still parametrizing $C$ past that mark is the sign the curve was closed and the shortcut was missed.
