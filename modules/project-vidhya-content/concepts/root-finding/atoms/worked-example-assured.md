---
# Alternative body for root-finding.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: root-finding.worked_example.assured
concept_id: root-finding
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: root-finding-worked-example
for_stance: assured
---

## Confirm the setup, then the answer

The convergence here is quadratic because the root is simple: $f'(x)=3x^2-1$ near $x^*\approx1.3247$ gives $f'(x^*)\approx3(1.7548)-1\approx4.26\neq0$, so neither "simple root" nor "$f'$ away from zero" is in doubt, and $x_0=1.5$ is close enough for the quadratic phase to show immediately.

$$x_1=1.3478,\quad x_2=1.3252,\quad x_3=1.3245,\quad \text{root}\approx1.3247$$

The residual sequence $0.875,\,0.1005,\,0.0029$ confirms the order directly — each new residual falls by a widening factor rather than a fixed one, the signature quadratic convergence leaves behind.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Newton-Raphson on x³ − x − 1 = 0","steps":[{"prompt":"Write down the Newton-Raphson update formula specifically for f(x) = x³ − x − 1.","hint":"The general formula is x_{n+1} = x_n − f(x_n)/f′(x_n). Compute f′(x) = 3x² − 1 by differentiating f(x) = x³ − x − 1.","answer":"x_{n+1} = x_n − (x_n³ − x_n − 1) / (3x_n² − 1)"},{"prompt":"Starting from x₀ = 1.5, evaluate f(1.5) and f′(1.5), then find x₁.","hint":"f(1.5) = (1.5)³ − 1.5 − 1 = 3.375 − 2.5 = 0.875. f′(1.5) = 3(2.25) − 1 = 5.75. Then x₁ = 1.5 − 0.875/5.75.","answer":"x₁ = 1.5 − 0.1522 ≈ 1.3478"},{"prompt":"After three full iterations the root is approximately x ≈ ?  Also state the order of convergence of Newton-Raphson near a simple root.","hint":"Track x₀=1.5 → x₁≈1.3478 → x₂≈1.3252 → x₃≈1.3245. The residuals shrink quadratically: 0.875 → 0.1005 → 0.0029 → ≈0.","answer":"Root ≈ 1.3247; order of convergence = 2 (quadratic)"}]}
```

