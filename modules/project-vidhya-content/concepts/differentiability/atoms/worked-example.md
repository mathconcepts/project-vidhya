---
id: differentiability.worked_example
concept_id: differentiability
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** $f(x)=x^2$ for $x<1$, and $f(x)=ax+b$ for $x\ge1$. Find $a,b$ so that $f$ is differentiable at $x=1$.

Differentiability at a join point needs **two** conditions, not one: continuity first, then matching one-sided derivatives.

---

**Step 1 — Impose continuity at $x=1$.**

$$
\lim_{x\to1^-}x^2 = 1, \qquad f(1)=a(1)+b=a+b
$$

Continuity requires $a+b=1$. — call this equation (i).

---

**Step 2 — Impose matching one-sided derivatives.**

Left-hand derivative (from $f(x)=x^2$): $f'(x)=2x$, so at $x=1$, left derivative $=2$.

Right-hand derivative (from $f(x)=ax+b$): $f'(x)=a$, constant.

Differentiability requires the two to match: $a=2$. — call this equation (ii).

---

**Step 3 — Solve.**

From (ii), $a=2$. Substituting into (i): $2+b=1\Rightarrow b=-1$.

$$
\boxed{a=2,\ b=-1}
$$

---

**Sanity check.** With $a=2,b=-1$: at $x=1$, both pieces give $f(1)=1$ (continuity holds), and both one-sided derivatives equal $2$ (differentiability holds). At $x=1.1$ from the right: $f(1.1)=2(1.1)-1=1.2$; from the left, extrapolating the parabola's own slope near $1$, $f(1)+2(0.1)=1.2$ — consistent.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: find a, b so f(x)=x^2 (x<1), f(x)=ax+b (x>=1) is differentiable at x=1","steps":[{"prompt":"First impose continuity at x=1. What equation does that give you?","hint":"Set the limit of x^2 as x to 1 equal to a(1)+b.","answer":"lim_{x to 1^-} x^2 = 1, and f(1) = a + b, so continuity requires a + b = 1."},{"prompt":"Now impose matching one-sided derivatives at x=1. What equation does THIS give you?","hint":"Differentiate each piece separately: d/dx(x^2) = 2x; d/dx(ax+b) = a.","answer":"Left derivative at x=1 is 2(1)=2. Right derivative is a (constant). Matching requires a = 2."},{"prompt":"Solve the two equations together. What are a and b?","hint":"Substitute a = 2 into a + b = 1.","answer":"a = 2, and b = 1 - 2 = -1, so \\boxed{a=2,\\ b=-1}."}]}
```
