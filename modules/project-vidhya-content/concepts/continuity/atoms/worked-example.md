---
id: continuity.worked_example
concept_id: continuity
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** $f(x)=\dfrac{x^3-1}{x-1}$ for $x\neq 1$, and $f(1)=5$. Is $f$ continuous at $x=1$? If not, classify the discontinuity and state the value that would fix it.

---

**Step 1 — Check condition (1): is $f(1)$ defined?**

Yes, by the given piecewise rule: $f(1)=5$.

---

**Step 2 — Check condition (2): does $\lim_{x\to1}f(x)$ exist?**

$$
\frac{x^3-1}{x-1}=\frac{(x-1)(x^2+x+1)}{x-1}=x^2+x+1, \quad x\neq 1
$$

$$
\lim_{x\to 1}f(x) = 1^2+1+1 = 3
$$

The limit exists and equals $3$.

---

**Step 3 — Check condition (3): does the limit equal $f(1)$?**

$\lim_{x\to1}f(x)=3$, but $f(1)=5$. **They disagree.** Condition (3) fails, so $f$ is **not continuous** at $x=1$.

---

**Step 4 — Classify and fix.**

The limit exists and is finite, so this is a **removable** discontinuity — redefining $f(1)$ is enough to repair it.

$$
\boxed{\text{Redefine } f(1)=3 \text{ to make } f \text{ continuous at } x=1}
$$

---

**Sanity check.** At $x=1.01$: $f(1.01)=1.01^2+1.01+1=3.0301$ — close to $3$, confirming the limit, and clearly not close to $5$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: is f(x) = (x^3-1)/(x-1), f(1)=5, continuous at x=1?","steps":[{"prompt":"Simplify (x^3-1)/(x-1) for x != 1. What single expression does it reduce to?","hint":"Factor x^3 - 1 as a difference of cubes: (x-1)(x^2+x+1).","answer":"x^2 + x + 1, valid for x != 1."},{"prompt":"What is lim_{x to 1} f(x), and does it equal f(1) = 5?","hint":"Substitute x = 1 into the simplified expression x^2 + x + 1.","answer":"The limit is 1 + 1 + 1 = 3, which does NOT equal f(1) = 5 — condition (3) for continuity fails."},{"prompt":"Since the limit exists and is finite but disagrees with f(1), what type of discontinuity is this, and what value fixes it?","hint":"A finite, existing limit that just doesn't match f(a) is the removable case.","answer":"A removable discontinuity — redefining \\boxed{f(1)=3} makes f continuous at x=1."}]}
```
