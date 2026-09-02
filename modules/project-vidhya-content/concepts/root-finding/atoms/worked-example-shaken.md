---
# Alternative body for root-finding.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: root-finding.worked-example.shaken
concept_id: root-finding
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: root-finding.worked-example
for_stance: shaken
---

Stop once $|x_{n+1}-x_n|$ drops below the fourth decimal place — fixed here before a single step runs.

$$f(1.5)=0.875,\quad f'(1.5)=5.75,\quad x_1=1.5-\frac{0.875}{5.75}=1.3478$$

$$f(1.3478)=0.1005,\quad f'(1.3478)=4.4498,\quad x_2=1.3478-\frac{0.1005}{4.4498}=1.3252$$

| $n$ | $x_n$ | $f(x_n)$ |
|---|---|---|
| $0$ | $1.5000$ | $0.8750$ |
| $1$ | $1.3478$ | $0.1005$ |
| $2$ | $1.3252$ | $0.0029$ |

The residual did not just shrink — it shrank by a bigger factor each round, $0.875\to0.1005$ then $0.1005\to0.0029$. That acceleration is quadratic convergence, not merely fast convergence.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Newton-Raphson on x³ − x − 1 = 0","steps":[{"prompt":"Write the Newton-Raphson update formula specifically for f(x) = x³ − x − 1.","hint":"The general formula is x_{n+1} = x_n − f(x_n)/f′(x_n). Differentiate f to get f′(x) = 3x² − 1.","answer":"x_{n+1} = x_n − (x_n³ − x_n − 1) / (3x_n² − 1)"},{"prompt":"Starting from x₀ = 1.5, evaluate f(1.5) and f′(1.5), then find x₁.","hint":"f(1.5) = 3.375 − 1.5 − 1 = 0.875. f′(1.5) = 3(2.25) − 1 = 5.75. Then x₁ = 1.5 − 0.875/5.75.","answer":"x₁ = 1.5 − 0.1522 ≈ 1.3478"},{"prompt":"After three full iterations the root is approximately x ≈ ? Also state the order of convergence of Newton-Raphson near a simple root.","hint":"Track x₀=1.5 → x₁≈1.3478 → x₂≈1.3252 → x₃≈1.3245. The residuals shrink quadratically: 0.875 → 0.1005 → 0.0029 → ≈0.","answer":"Root ≈ 1.3247; order of convergence = 2 (quadratic)"}]}
```
