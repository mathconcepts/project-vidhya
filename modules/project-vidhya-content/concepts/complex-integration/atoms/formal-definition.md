---
id: complex-integration.formal-definition
concept_id: complex-integration
atom_type: formal_definition
bloom_level: 2
difficulty: 0.48
exam_ids: ["*"]
---

For an analytic function $f$ on and inside a closed contour $C$ (traced counterclockwise), Cauchy's integral theorem states:
$$\oint_C f(z) \, dz = 0$$

More generally, if $f$ is analytic inside a region containing $C$, and $z_0$ is strictly inside $C$, **Cauchy's Integral Formula** gives:
$$f(z_0) = \frac{1}{2\pi i} \oint_C \frac{f(z)}{z - z_0} \, dz$$

This formula extracts the value of an analytic function at an interior point from its values on the boundary alone.

**Which tool applies.** Use Cauchy's Integral Formula when the contour encloses exactly **one** singularity of the integrand and the rest of the integrand is analytic — not the residue theorem's general machinery, which is built for arbitrarily many enclosed singularities and needs each residue computed. Reaching for the residue theorem on a single clean pole works but costs an unnecessary detour through residue formulas when $2\pi i\,f(z_0)$ already finishes the problem in one substitution.
