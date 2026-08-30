---
# Alternative body for gauss-divergence.worked-example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: gauss-divergence.worked_example.shaken
concept_id: gauss-divergence
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: gauss-divergence-worked-example
for_stance: shaken
---

$\mathbf F=(x,y,z)$ over the sphere $S:x^2+y^2+z^2=4$, outward normal. Check first that $S$ is closed — it is a full sphere, no rim — and that $\mathbf F$ is smooth everywhere inside it, since it is a polynomial. Both hold, so Gauss applies.

Divergence: $\partial_x x=1$, $\partial_y y=1$, $\partial_z z=1$. Add them: $\nabla\cdot\mathbf F=3$.

Volume enclosed: radius $R=2$, so $\text{Vol}=\frac43\pi R^3=\frac43\pi(8)=\frac{32\pi}{3}$.

Multiply: flux $=3\times\frac{32\pi}{3}=32\pi$.

Check by the direct route: on the sphere, $\hat n=\frac1R(x,y,z)$, so $\mathbf F\cdot\hat n=\frac{x^2+y^2+z^2}{R}=\frac{4}{2}=2$, constant over the whole surface. Surface area is $4\pi R^2=16\pi$. Direct flux $=2\times16\pi=32\pi$, the same number, reached the long way.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Gauss's theorem for F = (x,y,z) over a sphere","steps":[{"prompt":"For F = (x, y, z), compute div F = ∂F_x/∂x + ∂F_y/∂y + ∂F_z/∂z.","hint":"Each component differentiates to 1. Sum the three results.","answer":"1 + 1 + 1 = 3"},{"prompt":"The sphere x²+y²+z²=4 has radius R=2. Write the volume integral that Gauss's theorem gives you.","hint":"∯_S F·dS = ∭_V (div F) dV = 3 × Vol(V). The volume of a sphere of radius R is (4/3)πR³.","answer":"3 × (4/3)π(2)³ = 3 × (32π/3) = 32π"},{"prompt":"Verify directly: on the sphere r=2, show F·n̂ is constant and compute the surface integral.","hint":"The outward unit normal is n̂ = r̂ = (x,y,z)/2. F·n̂ = (x²+y²+z²)/2. On the sphere, x²+y²+z²=4.","answer":"F·n̂ = 4/2 = 2 everywhere. Surface area = 4π(2²) = 16π. Integral = 2 × 16π = 32π ✓"}]}
```
