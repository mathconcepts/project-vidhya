---
# Alternative body for gauss-divergence.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: gauss-divergence.worked_example.assured
concept_id: gauss-divergence
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: gauss-divergence-worked-example
for_stance: assured
---

$\mathbf F=(x,y,z)$, sphere radius $2$: $\nabla\cdot\mathbf F=3$, so flux $=3\cdot\frac43\pi(2)^3=32\pi$, no parametrization needed once $S$ is confirmed closed and $\mathbf F$ smooth throughout the solid ball.

The same idea scales: for $\mathbf F=(x^3,y^3,z^3)$, $\nabla\cdot\mathbf F=3(x^2+y^2+z^2)=3r^2$, and in spherical coordinates $\iiint_V 3r^2\,dV=3\int_0^{2\pi}d\theta\int_0^\pi\sin\phi\,d\phi\int_0^2 r^4\,dr=3\cdot2\pi\cdot2\cdot\frac{32}{5}=\frac{384\pi}{5}$, where direct surface integration of a cubic normal component over a sphere would be far worse.

The mark at risk isn't the arithmetic, it's the hypothesis check: this shortcut needs $\mathbf F$ differentiable everywhere inside $V$, not merely on $S$. A field like $\hat r/r^2$ fails that at the origin, and constant-times-volume stops being valid the instant a singularity sits inside the surface — confirm smoothness on the interior before reaching for the volume formula, not after.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Gauss's theorem for F = (x,y,z) over a sphere","steps":[{"prompt":"For F = (x, y, z), compute div F = ∂F_x/∂x + ∂F_y/∂y + ∂F_z/∂z.","hint":"Each component differentiates to 1. Sum the three results.","answer":"1 + 1 + 1 = 3"},{"prompt":"The sphere x²+y²+z²=4 has radius R=2. Write the volume integral that Gauss's theorem gives you.","hint":"∯_S F·dS = ∭_V (div F) dV = 3 × Vol(V). The volume of a sphere of radius R is (4/3)πR³.","answer":"3 × (4/3)π(2)³ = 3 × (32π/3) = 32π"},{"prompt":"Verify directly: on the sphere r=2, show F·n̂ is constant and compute the surface integral.","hint":"The outward unit normal is n̂ = r̂ = (x,y,z)/2. F·n̂ = (x²+y²+z²)/2. On the sphere, x²+y²+z²=4.","answer":"F·n̂ = 4/2 = 2 everywhere. Surface area = 4π(2²) = 16π. Integral = 2 × 16π = 32π ✓"}]}
```
