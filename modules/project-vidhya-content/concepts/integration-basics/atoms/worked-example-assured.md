---
# Alternative body for integration-basics.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: integration-basics.worked_example.assured
concept_id: integration-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-basics.worked_example
for_stance: assured
---

All three terms integrate in one pass, term by term, without separately naming linearity: $3x^2\to x^3$, $4\sin x\to-4\cos x$, $-e^x\to-e^x$.

**Answer:** $x^3-4\cos x-e^x+C$, confirmed by differentiating back: $3x^2+4\sin x-e^x$, matching the integrand exactly.

The habit that catches errors fastest on this pattern: differentiate the answer before moving on, every time — faster than re-deriving, and it catches a dropped coefficient or sign flip that a second read-through of the integration steps usually misses.

Watch for a term shaped like $x^{-1}$ hiding among polynomial terms: the power rule silently fails there ($n+1=0$), and the correct antiderivative is $\ln|x|$, not $\frac{x^0}{0}$. An integrand mixing $x^2$, $x^{-1}$, and $e^x$ in one expression is testing exactly whether that exception is caught before it is applied.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Find the antiderivative of a polynomial","steps":[{"prompt":"Step 1: Rewrite the integral using linearity. Separate $\\int (3x^2 + 4\\sin x - e^x) dx$ into three independent integrals.","hint":"Linearity means: $\\int [f(x) + g(x)] dx = \\int f(x) dx + \\int g(x) dx$. Handle the minus sign as adding a negative.","answer":"$\\int 3x^2 dx + \\int 4\\sin x dx - \\int e^x dx$"},{"prompt":"Step 2: For the first term, apply the power rule: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$. What is $\\int 3x^2 dx$?","hint":"Power rule with $n=2$ gives $\\frac{x^3}{3}$. Don't forget the coefficient 3 in front.","answer":"$3 \\cdot \\frac{x^3}{3} = x^3$"},{"prompt":"Step 3: For the remaining two terms, recall: $\\int \\sin x dx = -\\cos x + C$ and $\\int e^x dx = e^x + C$. Combine all three antiderivatives into one expression.","hint":"Don't drop the constant of integration $C$ at the very end. The sign before $e^x$ is negative because we had $-\\int e^x dx$.","answer":"$x^3 - 4\\cos x - e^x + C$"}],"caption":"Key exam insight: Always split complex integrands by linearity, apply known formulas term-by-term, and verify by differentiating."}
```
