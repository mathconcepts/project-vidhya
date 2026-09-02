---
id: root-finding.worked-example
concept_id: root-finding
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Using Newton-Raphson, find the root of $f(x)=x^3-x-1=0$ near $x_0=1.5$. Perform three iterations and state the root to four decimal places.

---

**Step 1 — Set up.** $f(x)=x^3-x-1$, $f'(x)=3x^2-1$, update rule $x_{n+1}=x_n-f(x_n)/f'(x_n)$.

---

**Step 2 — Iteration 1.** $f(1.5)=3.375-1.5-1=0.875$, $f'(1.5)=3(2.25)-1=5.75$.
$$x_1=1.5-\frac{0.875}{5.75}=1.3478$$

---

**Step 3 — Iteration 2.** $f(1.3478)=1.3478^3-1.3478-1\approx0.1005$, $f'(1.3478)=3(1.3478)^2-1\approx4.4498$.
$$x_2=1.3478-\frac{0.1005}{4.4498}=1.3252$$

---

**Step 4 — Iteration 3.** $f(1.3252)\approx0.0029$, $f'(1.3252)\approx4.2683$.
$$x_3=1.3252-\frac{0.0029}{4.2683}=1.3245$$

---

**Result:** $\boxed{\text{root}\approx1.3247}$ (one more iteration settles the fourth decimal). Residuals $0.875\to0.1005\to0.0029$ shrink by a widening factor each step — the signature of quadratic convergence, not just fast convergence.

**Verification:** $x^{*3}-x^*-1$ at $x^*=1.3247$: $1.3247^3\approx2.3247$, so $2.3247-1.3247-1=0.0000$ ✓.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Newton-Raphson on x³ − x − 1 = 0","steps":[{"prompt":"Write the Newton-Raphson update formula specifically for f(x) = x³ − x − 1.","hint":"The general formula is x_{n+1} = x_n − f(x_n)/f′(x_n). Differentiate f to get f′(x) = 3x² − 1.","answer":"x_{n+1} = x_n − (x_n³ − x_n − 1) / (3x_n² − 1)"},{"prompt":"Starting from x₀ = 1.5, evaluate f(1.5) and f′(1.5), then find x₁.","hint":"f(1.5) = 3.375 − 1.5 − 1 = 0.875. f′(1.5) = 3(2.25) − 1 = 5.75. Then x₁ = 1.5 − 0.875/5.75.","answer":"x₁ = 1.5 − 0.1522 ≈ 1.3478"},{"prompt":"After three full iterations the root is approximately x ≈ ? Also state the order of convergence of Newton-Raphson near a simple root.","hint":"Track x₀=1.5 → x₁≈1.3478 → x₂≈1.3252 → x₃≈1.3245. The residuals shrink quadratically: 0.875 → 0.1005 → 0.0029 → ≈0.","answer":"Root ≈ 1.3247; order of convergence = 2 (quadratic)"}]}
```
