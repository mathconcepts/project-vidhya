---
# Alternative body for multiple-integrals.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multiple-integrals.worked_example.assured
concept_id: multiple-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: multiple-integrals.worked-example
for_stance: assured
---

$e^{-(x^2+y^2)}$ depending only on $r$ over a disk is the immediate cue for polar, no separate recognition step needed: $x^2+y^2=r^2$, $dA=r\,dr\,d\theta$, region becomes $r\in[0,1]$, $\theta\in[0,2\pi]$.

$\int_0^{2\pi}\int_0^1 re^{-r^2}\,dr\,d\theta$: the inner integral is a one-line substitution ($u=-r^2$) giving $\frac12(1-e^{-1})$, constant in $\theta$, so the outer integral is just that constant times $2\pi$.

**Answer:** $\pi(1-e^{-1})$.

This pattern — radially symmetric integrand, disk or annulus or sector region — always collapses this way: the $\theta$-integral becomes trivial multiplication by the angular sweep once the $r$-integral is separated out, precisely because polar coordinates were built to make circular symmetry factor apart like this.

The trap that survives fluency: forgetting the Jacobian factor $r$ is still the single most common error on this pattern, precisely *because* $e^{-(x^2+y^2)}$ looks self-contained — the $r$ comes from the *area element*, not the integrand, and it must be supplied regardless of what the integrand already contains.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Double integral in polar coordinates","steps":[{"prompt":"Step 1: What symmetry do you notice in $e^{-(x^2+y^2)}$?","hint":"The exponent involves $x^2 + y^2$. What does this quantity represent geometrically?","answer":"The integrand depends only on distance from the origin: $r = \\sqrt{x^2+y^2}$. This suggests using polar coordinates."},{"prompt":"Step 2: Write the Jacobian for the transformation from Cartesian to polar coordinates.","hint":"Remember: $x = r\\cos\\theta$, $y = r\\sin\\theta$. The area element changes by a factor equal to the absolute value of the determinant of the Jacobian matrix.","answer":"$dA = r \\, dr \\, d\\theta$ (the Jacobian factor is $r$)"},{"prompt":"Step 3: Set up the bounds. For the unit disk $x^2+y^2 \\leq 1$, what are the limits on $r$ and $\\theta$?","hint":"The radius ranges from the center to the boundary circle. The angle sweeps all the way around.","answer":"$0 \\leq r \\leq 1$ and $0 \\leq \\theta \\leq 2\\pi$"}],"caption":"Master polar coordinates: the key to solving radially symmetric integrals efficiently."}
```
