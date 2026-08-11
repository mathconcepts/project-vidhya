---
id: complex-integration.formal-definition
concept_id: complex-integration
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

**Cauchy's Integral Theorem & Formula**: For an analytic function $f$ on and inside a closed contour $C$ (traced counterclockwise), Cauchy's integral theorem states:
$$\oint_C f(z) \, dz = 0$$

More generally, if $f$ is analytic inside a region and $C$ is a closed contour in that region, and if $z_0$ is inside $C$, then **Cauchy's Integral Formula** gives:
$$f(z_0) = \frac{1}{2\pi i} \oint_C \frac{f(z)}{z - z_0} \, dz$$

This formula allows us to extract the value of an analytic function at an interior point from its values on the boundary.
