---
id: residue-calculus.formal-definition
concept_id: residue-calculus
atom_type: formal_definition
bloom_level: 2
difficulty: 0.56
exam_ids: ["*"]
---

**The Residue Theorem**: Let $f$ be analytic on and inside a closed contour $C$ except for isolated singularities $z_1, z_2, \ldots, z_n$ inside $C$. Then:
$$\oint_C f(z) \, dz = 2\pi i \sum_{k=1}^{n} \text{Res}(f, z_k)$$

The **residue** at a pole $z_k$ of order $m$ is given by:
$$\text{Res}(f, z_k) = \frac{1}{(m-1)!} \lim_{z \to z_k} \frac{d^{m-1}}{dz^{m-1}} \left[ (z - z_k)^m f(z) \right]$$

For a **simple pole** (order 1):
$$\text{Res}(f, z_k) = \lim_{z \to z_k} (z - z_k) f(z)$$
