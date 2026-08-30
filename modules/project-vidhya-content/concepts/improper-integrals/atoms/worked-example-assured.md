---
# Alternative body for improper-integrals.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: improper-integrals.worked_example.assured
concept_id: improper-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: improper-integrals.worked_example
for_stance: assured
---

$p=2>1$ closes it by the $p$-test alone: $\int_1^\infty x^{-p}\,dx$ converges iff $p>1$, so no antiderivative is even needed to answer "converges or diverges."

**Answer:** converges, to $1$ (by direct computation: $\left[-\frac1x\right]_1^\infty=0-(-1)=1$).

The faster route generalizes by comparison: $\int_1^\infty\frac{dx}{x^2+1}$ needs no antiderivative either, since $0<\frac1{x^2+1}<\frac1{x^2}$ for all $x\ge1$ and $\int_1^\infty\frac{dx}{x^2}$ already converges — a smaller nonnegative integrand under a convergent one must itself converge.

The condition that makes comparison valid, and the one that costs marks when skipped: the inequality must hold on the *entire* tail of the interval, and both functions must be nonnegative there. A comparison holding only for $x>100$ is still enough — convergence is a statement about tails — but one that fails anywhere in $[1,\infty)$, or an integrand that goes negative, invalidates the argument outright.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Evaluating $\\int_1^\\infty 1/x^2\\,dx$","steps":[{"prompt":"Step 1: Rewrite the improper integral using a limit. What is the definition?","hint":"An improper integral with an infinite upper bound is defined as $\\int_a^\\infty f(x)\\,dx = \\lim_{R \\to \\infty} \\int_a^R f(x)\\,dx$","answer":"$$\\int_1^\\infty \\frac{1}{x^2}\\,dx = \\lim_{R \\to \\infty} \\int_1^R \\frac{1}{x^2}\\,dx$$"},{"prompt":"Step 2: Find the antiderivative of $1/x^2$. Rewrite as $x^{-2}$ and apply the power rule.","hint":"The power rule states $\\int x^n\\,dx = \\frac{x^{n+1}}{n+1}$ for $n \\neq -1$. Here, $n = -2$.","answer":"$$\\int x^{-2}\\,dx = \\frac{x^{-1}}{-1} = -\\frac{1}{x} + C$$"},{"prompt":"Step 3: Evaluate the definite integral from 1 to $R$, then find the limit as $R \\to \\infty$.","hint":"Use the Fundamental Theorem: $\\int_1^R \\frac{1}{x^2}\\,dx = \\left[-\\frac{1}{x}\\right]_1^R = -\\frac{1}{R} - (-1)$. Then take $\\lim_{R \\to \\infty}$.","answer":"$$\\lim_{R \\to \\infty} \\left(-\\frac{1}{R} + 1\\right) = 0 + 1 = 1$$"}],"caption":"Key exam insight: Improper integrals converge when the integrand decays fast enough. Use the p-test as a quick check."}
```
