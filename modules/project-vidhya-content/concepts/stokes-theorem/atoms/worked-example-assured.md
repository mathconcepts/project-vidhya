---
# Alternative body for stokes-theorem.worked-example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: stokes-theorem.worked_example.assured
concept_id: stokes-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: stokes-theorem-worked-example
for_stance: assured
---

$\mathbf F=(y,-x,z)$, hemisphere with boundary the unit circle $C$ at $z=0$, counterclockwise: $\nabla\times\mathbf F=-2\hat k$. Swap the hemisphere for the flat disk $D$ sharing its rim — curl is defined everywhere between the two surfaces, so the swap is valid — giving $\iint_D(-2)\,dA=-2\pi$. Direct check: $\oint_C\mathbf F\cdot d\mathbf r=\int_0^{2\pi}(-\sin^2\theta-\cos^2\theta)\,d\theta=-2\pi$.

The number worth defending isn't the integral, it is $\hat n=\hat k$: upward is what the right-hand rule demands for a counterclockwise $C$ viewed from above. Choosing $\hat n=-\hat k$ instead flips the surface integral to $+2\pi$ while the line integral, fixed by the stated counterclockwise direction, stays at $-2\pi$ — the two sides stop agreeing, which is the tell that the normal was chosen inconsistently with $C$, not that Stokes' theorem failed.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: verifying Stokes' theorem for F = (y, −x, z)","steps":[{"prompt":"Compute the k̂ component of curl F for F = (y, −x, z).","hint":"The k̂ component is ∂F_y/∂x − ∂F_x/∂y. Here F_y = −x and F_x = y.","answer":"∂(−x)/∂x − ∂(y)/∂y = −1 − 1 = −2. So curl F = −2k̂."},{"prompt":"Using the flat disk D (x²+y²≤1, z=0) instead of the hemisphere, compute ∬_D (curl F)·n̂ dA.","hint":"On the disk, n̂ = k̂ and dS = dA. So the integrand is (−2k̂)·k̂ = −2. Integrate over the unit disk.","answer":"−2 × area(unit disk) = −2π"},{"prompt":"Parametrize C as (cosθ, sinθ, 0). Compute F·dr and integrate from 0 to 2π.","hint":"F = (sinθ, −cosθ, 0) and dr = (−sinθ, cosθ, 0)dθ. Dot product = −sin²θ − cos²θ = −1.","answer":"∫₀²π (−1) dθ = −2π. This matches the surface integral, verifying Stokes' theorem."}]}
```
