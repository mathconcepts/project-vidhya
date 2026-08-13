---
id: limits-worked-example
concept_id: limits
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Limits — Worked Example

## GATE-Style Problem

> **Evaluate:** $\displaystyle\lim_{x \to 1} \frac{x^2 - 1}{x - 1}$

This is a classic GATE Engineering Mathematics problem. Direct substitution gives $\frac{0}{0}$ — an indeterminate form. We must simplify before evaluating.

---

## Step-by-Step Solution

**Step 1 — Recognise the indeterminate form.**

Substituting $x = 1$ directly:

$$\frac{(1)^2 - 1}{1 - 1} = \frac{0}{0} \quad \text{(indeterminate)}$$

We cannot evaluate as-is. The function has a hole at $x = 1$, but the limit may still exist.

**Step 2 — Factor the numerator.**

$$\frac{x^2 - 1}{x - 1} = \frac{(x-1)(x+1)}{x-1}$$

Since we are taking a limit as $x \to 1$ (not setting $x = 1$), the factor $(x - 1)$ is **never zero** in this process. We may cancel:

$$= x + 1, \quad x \neq 1$$

**Step 3 — Evaluate the simplified expression.**

$$\lim_{x \to 1} \frac{x^2 - 1}{x - 1} = \lim_{x \to 1} (x + 1) = 1 + 1 = \boxed{2}$$

---

## Sanity Check

- Left-hand limit ($x \to 1^-$): $x + 1 \to 2$ ✓
- Right-hand limit ($x \to 1^+$): $x + 1 \to 2$ ✓
- Both agree, so the limit exists and equals $2$.

Note: $f(1)$ is **undefined** for the original expression, which is perfectly fine — the limit exists regardless.

---

## Generalisation

For any polynomial factorisation of the form $\frac{x^n - a^n}{x - a}$:

$$\lim_{x \to a} \frac{x^n - a^n}{x - a} = n \cdot a^{n-1}$$

This is a direct consequence of the definition of the derivative: $\lim_{x \to a} \frac{f(x)-f(a)}{x-a} = f'(a)$ for $f(x) = x^n$.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"Direct substitution in $\\lim_{x \\to 1} \\frac{x^2-1}{x-1}$ gives what form? Why can't we stop there?","hint":"Plug $x=1$ into both numerator and denominator separately.","answer":"We get $\\frac{0}{0}$, which is **indeterminate** — it carries no information about the true limit. We must simplify the expression before evaluating."},{"prompt":"After factoring and cancelling $(x-1)$, what is the simplified expression, and what is the final limit?","hint":"Factor $x^2 - 1$ as a difference of squares: $(x-1)(x+1)$.","answer":"The simplified expression is $x+1$ (valid for $x \\neq 1$). Substituting $x=1$ gives $\\lim_{x \\to 1}(x+1) = \\boxed{2}$."}]}
```
