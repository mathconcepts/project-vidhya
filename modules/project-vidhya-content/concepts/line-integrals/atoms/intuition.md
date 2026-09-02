---
id: line-integrals.intuition
concept_id: line-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.12
exam_ids: ["*"]
modality: visual
---

A line integral totals a quantity along a curve rather than over an interval — the curve replaces $[a,b]$ as the domain, but "add up infinitely many small pieces" works exactly as before.

Two versions answer different questions. The **scalar** version, $\int_C f\,ds$, weights by arc length: picture $f$ as a wire's linear density, and the integral gives the wire's total mass — direction never enters. The **vector** version, $\int_C \mathbf F\cdot d\mathbf r$, weights by displacement: picture $\mathbf F$ as a force and $d\mathbf r$ as the tiny step taken along the path, so the integral totals work — here direction matters completely, since $d\mathbf r$ carries a sign.

For $\mathbf F=(-y,x)$ traced once around the unit circle: forward (counterclockwise) gives $2\pi$; backward (clockwise) gives $-2\pi$. Same curve, same force, opposite sign — because the vector integral is sensitive to which way the curve was walked, in a way the scalar integral over the identical curve never is.
