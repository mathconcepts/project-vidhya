---
# Alternative body for improper-integrals.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: improper-integrals.worked_example.shaken
concept_id: improper-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: improper-integrals.worked_example
for_stance: shaken
---

**Given:** $\int_1^\infty\frac{dx}{x^2}$. Does it converge?

**Step 1.** Replace $\infty$ with $R$: $\int_1^\infty\frac{dx}{x^2}=\lim_{R\to\infty}\int_1^R x^{-2}\,dx$.

**Step 2.** Find the antiderivative only: $\int x^{-2}\,dx=-\dfrac1x$.

**Step 3.** Plug in the bounds: $\left[-\dfrac1x\right]_1^R=-\dfrac1R-(-1)=1-\dfrac1R$.

**Step 4.** Take the limit: as $R\to\infty$, $\dfrac1R\to0$, so the value $\to1$.

**Answer:** converges to $1$.

**Check it:** the $p$-test says $\int_a^\infty x^{-p}dx$ converges exactly when $p>1$; here $p=2>1$, matching the direct answer.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Evaluating $\\int_1^\\infty 1/x^2\\,dx$","steps":[{"prompt":"Step 1: Rewrite the improper integral using a limit. What is the definition?","hint":"An improper integral with an infinite upper bound is defined as $\\int_a^\\infty f(x)\\,dx = \\lim_{R \\to \\infty} \\int_a^R f(x)\\,dx$","answer":"$$\\int_1^\\infty \\frac{1}{x^2}\\,dx = \\lim_{R \\to \\infty} \\int_1^R \\frac{1}{x^2}\\,dx$$"},{"prompt":"Step 2: Find the antiderivative of $1/x^2$. Rewrite as $x^{-2}$ and apply the power rule.","hint":"The power rule states $\\int x^n\\,dx = \\frac{x^{n+1}}{n+1}$ for $n \\neq -1$. Here, $n = -2$.","answer":"$$\\int x^{-2}\\,dx = \\frac{x^{-1}}{-1} = -\\frac{1}{x} + C$$"},{"prompt":"Step 3: Evaluate the definite integral from 1 to $R$, then find the limit as $R \\to \\infty$.","hint":"Use the Fundamental Theorem: $\\int_1^R \\frac{1}{x^2}\\,dx = \\left[-\\frac{1}{x}\\right]_1^R = -\\frac{1}{R} - (-1)$. Then take $\\lim_{R \\to \\infty}$.","answer":"$$\\lim_{R \\to \\infty} \\left(-\\frac{1}{R} + 1\\right) = 0 + 1 = 1$$"}],"caption":"Key exam insight: Improper integrals converge when the integrand decays fast enough. Use the p-test as a quick check."}
```
