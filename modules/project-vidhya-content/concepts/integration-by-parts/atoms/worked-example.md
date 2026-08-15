---
id: integration-by-parts.worked_example
concept_id: integration-by-parts
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
---

# Worked Example: Integration by Parts

## Problem (GATE-Style)

Evaluate: $$\int x^2 e^x \, dx$$

## Solution

**Step 1: Apply LIATE to choose $u$ and $dv$**

We have an algebraic function ($x^2$) and an exponential ($e^x$). By LIATE, algebraic comes before exponential, so:
- $u = x^2 \quad \Rightarrow \quad du = 2x \, dx$
- $dv = e^x \, dx \quad \Rightarrow \quad v = e^x$

**Step 2: Apply the formula**

$$\int x^2 e^x \, dx = x^2 e^x - \int e^x \cdot 2x \, dx = x^2 e^x - 2\int x e^x \, dx$$

**Step 3: Recognize we need to apply integration by parts again**

The remaining integral $\int x e^x \, dx$ still has the product $x \cdot e^x$. Apply LIATE again:
- $u = x \quad \Rightarrow \quad du = dx$
- $dv = e^x \, dx \quad \Rightarrow \quad v = e^x$

$$\int x e^x \, dx = x e^x - \int e^x \, dx = x e^x - e^x$$

**Step 4: Substitute back**

$$\int x^2 e^x \, dx = x^2 e^x - 2(x e^x - e^x)$$

$$= x^2 e^x - 2x e^x + 2e^x$$

$$= e^x(x^2 - 2x + 2) + C$$

## Verification

Differentiate the answer:
$$\frac{d}{dx}[e^x(x^2 - 2x + 2)] = e^x(x^2 - 2x + 2) + e^x(2x - 2)$$
$$= e^x(x^2 - 2x + 2 + 2x - 2) = x^2 e^x \quad \checkmark$$

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Solve: ∫x² eˣ dx using integration by parts (repeated)","steps":[{"prompt":"Step 1: Use LIATE to choose u and dv. What should u be?","hint":"LIATE: Logarithmic, Inverse trig, Algebraic, Trigonometric, Exponential. Which appears first in our integrand x²·eˣ?","answer":"u = x² (algebraic comes before exponential in LIATE)"},{"prompt":"Step 2: If u = x², what is dv and v?","hint":"Once u = x² and du = 2x dx, the remaining part is e^x dx","answer":"dv = e^x dx, so v = e^x"},{"prompt":"Step 3: Write the integration by parts formula: ∫u dv = uv - ∫v du","hint":"Plug in: u = x², v = e^x, du = 2x dx","answer":"∫x² e^x dx = x² e^x - ∫e^x · 2x dx = x² e^x - 2∫x e^x dx"},{"prompt":"Step 4: Now solve ∫x e^x dx using integration by parts again","hint":"Let u = x, dv = e^x dx. Then du = dx, v = e^x. Use the formula.","answer":"∫x e^x dx = x e^x - ∫e^x dx = x e^x - e^x"},{"prompt":"Step 5: Substitute back to get the final answer","hint":"Replace ∫x e^x dx in Step 3's result with (x e^x - e^x)","answer":"∫x² e^x dx = x² e^x - 2(x e^x - e^x) = e^x(x² - 2x + 2) + C"}],"caption":"Key insight: Repeated application of LIATE reduces polynomial degree step-by-step until only exponential/trig remains, which is integrable directly."}
```

---

DONE:integration-by-parts
