---
# Alternative body for integration-basics.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: integration-basics.worked_example.shaken
concept_id: integration-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-basics.worked_example
for_stance: shaken
---

**Given:** $\int(3x^2+4\sin x-e^x)\,dx$.

**Step 1.** Split by linearity: $\int3x^2dx+\int4\sin x\,dx-\int e^x dx$.

**Step 2.** $\int3x^2dx=x^3$.

**Step 3.** $\int4\sin x\,dx=-4\cos x$.

**Step 4.** $\int e^x dx=e^x$.

**Answer:** $x^3-4\cos x-e^x+C$.

**Check:** $\frac{d}{dx}[x^3-4\cos x-e^x]=3x^2+4\sin x-e^x$, matching.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Find the antiderivative of a polynomial","steps":[{"prompt":"Step 1: Rewrite the integral using linearity. Separate $\\int (3x^2 + 4\\sin x - e^x) dx$ into three independent integrals.","hint":"Linearity means: $\\int [f(x) + g(x)] dx = \\int f(x) dx + \\int g(x) dx$. Handle the minus sign as adding a negative.","answer":"$\\int 3x^2 dx + \\int 4\\sin x dx - \\int e^x dx$"},{"prompt":"Step 2: For the first term, apply the power rule: $\\int x^n dx = \\frac{x^{n+1}}{n+1} + C$. What is $\\int 3x^2 dx$?","hint":"Power rule with $n=2$ gives $\\frac{x^3}{3}$. Don't forget the coefficient 3 in front.","answer":"$3 \\cdot \\frac{x^3}{3} = x^3$"},{"prompt":"Step 3: For the remaining two terms, recall: $\\int \\sin x dx = -\\cos x + C$ and $\\int e^x dx = e^x + C$. Combine all three antiderivatives into one expression.","hint":"Don't drop the constant of integration $C$ at the very end. The sign before $e^x$ is negative because we had $-\\int e^x dx$.","answer":"$x^3 - 4\\cos x - e^x + C$"}],"caption":"Key exam insight: Always split complex integrands by linearity, apply known formulas term-by-term, and verify by differentiating."}
```
