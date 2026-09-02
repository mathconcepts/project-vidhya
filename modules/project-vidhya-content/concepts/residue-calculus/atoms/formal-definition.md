---
id: residue-calculus.formal-definition
concept_id: residue-calculus
atom_type: formal_definition
bloom_level: 2
difficulty: 0.56
exam_ids: ["*"]
---

Let $f$ be analytic on and inside a closed contour $C$ except for isolated singularities $z_1,\ldots,z_n$ inside $C$. The **Residue Theorem**:
$$\oint_C f(z) \, dz = 2\pi i \sum_{k=1}^{n} \text{Res}(f, z_k)$$

The **residue** at a pole $z_k$ of order $m$:
$$\text{Res}(f, z_k) = \frac{1}{(m-1)!} \lim_{z \to z_k} \frac{d^{m-1}}{dz^{m-1}} \left[ (z - z_k)^m f(z) \right]$$

For a **simple pole** ($m=1$): $\text{Res}(f, z_k) = \lim_{z \to z_k} (z - z_k) f(z)$.

**Which formula applies.** Use the order-$m$ derivative formula when $z_k$ is a genuine pole of finite order $m$ — the denominator vanishes to order $m$ there and the numerator doesn't. Don't force this formula onto an **essential** singularity, which some students try when a limit-based approach feels like it should generalize: no finite $m$ makes $(z-z_k)^mf(z)$ analytic at $z_k$ for $e^{1/z}$-type functions, so the derivative formula never applies there — the residue can only come from reading the Laurent series directly.
