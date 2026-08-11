---
id: conformal-mapping.formal-definition
concept_id: conformal-mapping
atom_type: formal_definition
bloom_level: 2
difficulty: 0.56
exam_ids: ["*"]
---

**Conformal Mapping**: An analytic function $f(z) = u(x, y) + iv(x, y)$ is called **conformal** at a point $z_0$ if $f'(z_0) \neq 0$ and if $f$ preserves angles at $z_0$. Geometrically, this means:
- Two curves intersecting at $z_0$ have the same angle of intersection before and after applying $f$.
- The magnification factor is $|f'(z_0)|$ (all lengths scale uniformly near $z_0$).

**Key Fact**: Every analytic function with $f'(z) \neq 0$ is conformal. The Jacobian determinant of $f$ is $|f'(z)|^2 > 0$, ensuring local invertibility.
