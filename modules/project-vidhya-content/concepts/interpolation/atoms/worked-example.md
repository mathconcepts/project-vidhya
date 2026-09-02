---
id: interpolation.worked-example
concept_id: interpolation
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Given $f(1)=2$, $f(2)=4$, $f(3)=8$, use Lagrange interpolation to estimate $f(1.5)$.

---

**Step 1 — Basis $L_1$ (node $x=1$).** $L_1(x)=\dfrac{(x-2)(x-3)}{(1-2)(1-3)}=\dfrac{(x-2)(x-3)}{2}$. At $x=1.5$: $L_1(1.5)=\dfrac{(-0.5)(-1.5)}{2}=0.375$.

---

**Step 2 — Basis $L_2$ (node $x=2$).** $L_2(x)=\dfrac{(x-1)(x-3)}{(2-1)(2-3)}=-(x-1)(x-3)$. At $x=1.5$: $L_2(1.5)=-(0.5)(-1.5)=0.75$.

---

**Step 3 — Basis $L_3$ (node $x=3$).** $L_3(x)=\dfrac{(x-1)(x-2)}{(3-1)(3-2)}=\dfrac{(x-1)(x-2)}{2}$. At $x=1.5$: $L_3(1.5)=\dfrac{(0.5)(-0.5)}{2}=-0.125$.

---

**Step 4 — Combine.** $\boxed{P(1.5)=2(0.375)+4(0.75)+8(-0.125)=0.75+3-1=2.75}$

**Verification:** $L_1(1.5)+L_2(1.5)+L_3(1.5)=0.375+0.75-0.125=1$ — the basis weights sum to $1$ at every $x$, a check that costs nothing and catches a dropped sign immediately.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Lagrange interpolation at x = 1.5","steps":[{"prompt":"Step 1: Set up the Lagrange basis polynomial L₁(x) for point 1. What is the denominator (x₁ − x₂)(x₁ − x₃)?","hint":"x₁ = 1, x₂ = 2, x₃ = 3. Multiply (1−2) × (1−3).","answer":"(1-2)(1-3) = (-1)(-2) = 2"},{"prompt":"Step 2: Evaluate L₁(1.5) using L₁(x) = (x-2)(x-3)/2.","hint":"Substitute x = 1.5: L₁(1.5) = (1.5-2)(1.5-3)/2 = (-0.5)(-1.5)/2.","answer":"L₁(1.5) = 0.375"},{"prompt":"Step 3: Evaluate L₂(1.5) and L₃(1.5), then compute P(1.5) = 2·L₁ + 4·L₂ + 8·L₃.","hint":"L₂(1.5) = 0.75 and L₃(1.5) = -0.125. Compute 2(0.375) + 4(0.75) + 8(-0.125).","answer":"P(1.5) = 0.75 + 3 - 1 = 2.75"}],"caption":"The basis weights always sum to 1 — check that before trusting the final combination."}
```
