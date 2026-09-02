---
id: gauss-divergence.exam_pattern
concept_id: gauss-divergence
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.7
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT flux questions reward checking $\operatorname{div}\mathbf F$ before setting up any integral.** If the divergence is a nonzero constant, the answer is that constant times the enclosed volume — no coordinate system needed beyond a volume formula.

  Example: for $\mathbf F=(y,z,x)$, $\operatorname{div}\mathbf F=0+0+0=0$ everywhere. The flux through **any** closed surface — sphere, cube, oddly-shaped solid — is $0$, read off without ever picking a specific surface.

- **MCQ "solenoidal field" questions test exactly this**: a field with $\operatorname{div}\mathbf F=0$ has zero flux through every closed surface it's defined on, not only the symmetric ones a diagram happens to show.

- **MSQ statements about singularities are a deliberate trap**: "the flux through any surface enclosing the origin is $0$ whenever $\operatorname{div}\mathbf F=0$ elsewhere" is **false** if $\mathbf F$ itself blows up at the origin — the theorem's differentiability requirement fails exactly where the singularity sits.

- **Time budget:** computing $\operatorname{div}\mathbf F$ and recognizing zero costs under 15 seconds; a nonzero-constant divergence paired with a standard solid (sphere, cylinder, cube) should still resolve in under 90.
