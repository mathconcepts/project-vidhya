---
id: continuity-worked-example
concept_id: continuity
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
---

# Continuity — Worked Example

## GATE-Style Problem

> **Determine whether $f$ is continuous at $x = 2$, where:**
> $$f(x) = \frac{x^2 - 4}{x - 2}$$

This is a canonical GATE problem on removable discontinuities. We apply the three-condition checklist.

---

## Step-by-Step Solution

**Step 1 — Check if $f(2)$ is defined.**

$$f(2) = \frac{(2)^2 - 4}{2 - 2} = \frac{0}{0} \quad \text{— undefined}$$

Condition 1 **fails** immediately. $f(2)$ does not exist.

**Step 2 — Check whether the limit $\lim_{x \to 2} f(x)$ exists.**

Even though $f(2)$ is undefined, we investigate the limit. Factor the numerator:

$$\frac{x^2 - 4}{x - 2} = \frac{(x-2)(x+2)}{x-2} = x + 2, \quad x \neq 2$$

Now evaluate:

$$\lim_{x \to 2} \frac{x^2 - 4}{x - 2} = \lim_{x \to 2} (x + 2) = 4$$

Both one-sided limits equal $4$, so the limit **exists** (Condition 2 passes).

**Step 3 — Compare the limit to $f(2)$.**

Since $f(2)$ is undefined, Condition 3 cannot be satisfied.

$$\therefore f \text{ is discontinuous at } x = 2.$$

**Step 4 — Classify the discontinuity.**

- The limit $\lim_{x \to 2} f(x) = 4$ exists (one agreed destination).
- $f(2)$ is simply not defined.

This is a **removable discontinuity**. We can repair it by extending $f$:

$$\tilde{f}(x) = \begin{cases} \dfrac{x^2 - 4}{x - 2}, & x \neq 2 \\ 4, & x = 2 \end{cases}$$

$\tilde{f}$ is continuous at $x = 2$.

---

## What Would a Jump Look Like Instead?

If the left-hand and right-hand limits were unequal — say $\lim_{x \to 2^-} f = 3$ and $\lim_{x \to 2^+} f = 5$ — the discontinuity would be a **jump** and no single redefinition could make $f$ continuous at $x = 2$.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","steps":[{"prompt":"Apply the three-condition checklist to $f(x) = \\frac{x^2-4}{x-2}$ at $x=2$. Which condition fails first, and why?","hint":"Substitute $x=2$ directly into the formula. What happens to the denominator?","answer":"**Condition 1 fails.** $f(2) = \\frac{0}{0}$ is undefined — the denominator is zero, so the function is not defined at $x=2$."},{"prompt":"Even though $f(2)$ is undefined, compute $\\lim_{x \\to 2} f(x)$ and name the type of discontinuity.","hint":"Factor $x^2-4 = (x-2)(x+2)$ and cancel the $(x-2)$ term before substituting.","answer":"$\\lim_{x \\to 2}(x+2) = 4$. The limit exists, but $f(2)$ is undefined, so this is a **removable discontinuity**. Redefining $f(2)=4$ makes the function continuous."}]}
```
