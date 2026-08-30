---
# Alternative body for stokes-theorem.worked-example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: stokes-theorem.worked_example.shaken
concept_id: stokes-theorem
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: stokes-theorem-worked-example
for_stance: shaken
---

$\mathbf F=(y,-x,z)$ over the hemisphere $x^2+y^2+z^2=1,\,z\ge0$, boundary $C:x^2+y^2=1$ at $z=0$, counterclockwise.

First the curl: only the $\hat k$ term is nonzero. $\partial_x(-x)-\partial_y(y)=-1-1=-2$. So $\nabla\times\mathbf F=-2\hat k$.

Trade the curved hemisphere for the flat disk $D$ sharing its rim — same boundary $C$, so Stokes gives the same answer either way. On $D$, the upward normal $\hat n=\hat k$ matches the counterclockwise $C$ by the right-hand rule, and $d\mathbf S=\hat k\,dA$: $\iint_S(\nabla\times\mathbf F)\cdot d\mathbf S=\iint_D(-2)\,dA=-2\pi(1)^2=-2\pi$.

Now walk $C$ directly to check: $x=\cos\theta,\,y=\sin\theta,\,z=0$. $\mathbf F\cdot d\mathbf r=y(-\sin\theta)+(-x)(\cos\theta)=-\sin^2\theta-\cos^2\theta=-1$. $\oint_C\mathbf F\cdot d\mathbf r=\int_0^{2\pi}(-1)\,d\theta=-2\pi$. Both sides agree, with the same orientation carried through both computations.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: verifying Stokes' theorem for F = (y, −x, z)","steps":[{"prompt":"Compute the k̂ component of curl F for F = (y, −x, z).","hint":"The k̂ component is ∂F_y/∂x − ∂F_x/∂y. Here F_y = −x and F_x = y.","answer":"∂(−x)/∂x − ∂(y)/∂y = −1 − 1 = −2. So curl F = −2k̂."},{"prompt":"Using the flat disk D (x²+y²≤1, z=0) instead of the hemisphere, compute ∬_D (curl F)·n̂ dA.","hint":"On the disk, n̂ = k̂ and dS = dA. So the integrand is (−2k̂)·k̂ = −2. Integrate over the unit disk.","answer":"−2 × area(unit disk) = −2π"},{"prompt":"Parametrize C as (cosθ, sinθ, 0). Compute F·dr and integrate from 0 to 2π.","hint":"F = (sinθ, −cosθ, 0) and dr = (−sinθ, cosθ, 0)dθ. Dot product = −sin²θ − cos²θ = −1.","answer":"∫₀²π (−1) dθ = −2π. This matches the surface integral, verifying Stokes' theorem."}]}
```
