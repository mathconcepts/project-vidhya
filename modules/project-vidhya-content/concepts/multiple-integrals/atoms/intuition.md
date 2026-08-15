---
id: multiple-integrals.intuition
concept_id: multiple-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

# Understanding Multiple Integrals

A **double integral** extends the idea of accumulation to two dimensions. Just as a single integral $\int_a^b f(x) dx$ sums infinitesimal line segments to find area under a curve, a double integral $\iint_R f(x,y) dA$ sums infinitesimal area elements to find **volume under a surface**.

Imagine a surface $z = f(x,y)$ hovering above a 2D region $R$ in the xy-plane. To find the volume trapped between the surface and the plane:
- Slice the region $R$ into tiny rectangles, each with area $dA = dx \, dy$
- At each point, the height is $f(x,y)$, so each pillar has volume $f(x,y) \, dA$
- Sum all pillars: $\iint_R f(x,y) \, dA$

**Triple integrals** work identically in 3D: they sum infinitesimal **volume elements** $dV = dx \, dy \, dz$ to find quantities like total mass or charge in a 3D region.

For exam problems, the key insight is recognizing when a **change of variables** simplifies the integral. Polar coordinates $x = r\cos\theta$, $y = r\sin\theta$ (with Jacobian $dA = r \, dr \, d\theta$) transform circular regions into rectangles in $(r, \theta)$ space. Similarly, cylindrical and spherical coordinates handle problems with radial or spherical symmetry.

The order of integration matters for difficulty—choose bounds that don't require splitting the region or using polar/cylindrical/spherical coordinates unless absolutely necessary.
