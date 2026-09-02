---
id: conformal-mapping.formal-definition
concept_id: conformal-mapping
atom_type: formal_definition
bloom_level: 2
difficulty: 0.56
exam_ids: ["*"]
---

An analytic function $f(z) = u(x, y) + iv(x, y)$ is **conformal** at a point $z_0$ if $f'(z_0) \neq 0$: two curves intersecting at $z_0$ have the same angle of intersection before and after applying $f$, and the local magnification factor is $|f'(z_0)|$ — all lengths near $z_0$ scale uniformly, in every direction.

**Key fact:** every analytic function with $f'(z)\neq0$ is conformal there. The Jacobian determinant of $f$ is $|f'(z)|^2>0$, ensuring local invertibility.

**Which check applies.** Use the two-part test — analytic at $z_0$, and $f'(z_0)\neq0$ — pointwise, at the specific $z_0$ in question. Don't reach for "$f$ is entire, so it's conformal everywhere" as a shortcut: entirety only secures the analyticity half. $f(z)=z^2$ is entire, yet $f'(0)=0$ makes $z=0$ a genuine exception where angles double instead of surviving — checking only "is $f$ analytic here" and skipping $f'\neq0$ is exactly the gap that costs the mark on this kind of question.
