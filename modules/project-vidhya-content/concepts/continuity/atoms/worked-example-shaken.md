---
# Alternative body for continuity.worked_example, served when the learner
# stance is `shaken`. Same steps, concrete-first, full arithmetic.
id: continuity.worked_example.shaken
concept_id: continuity
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: continuity.worked_example
for_stance: shaken
---

Same problem: $f(x)=\dfrac{x^3-1}{x-1}$ for $x\neq1$, $f(1)=5$. Three checks, done in order.

**Check 1.** Is $f(1)$ defined? Yes: $f(1)=5$, given directly.

**Check 2.** Does the limit exist? Factor: $x^3-1=(x-1)(x^2+x+1)$, so $f(x)=x^2+x+1$ for $x\neq1$. At $x=1$: $1+1+1=3$. Limit exists, equals $3$.

**Check 3.** Does the limit equal $f(1)$? $3\neq5$. No — condition (3) fails.

**Conclusion.** Not continuous at $x=1$. The limit is finite and exists, so this is removable.

$$
\boxed{\text{Redefine } f(1)=3 \text{ to fix it}}
$$

**Check.** At $x=1.01$: $1.01^2+1.01+1=3.0301$ — close to $3$, not close to $5$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: is f(x) = (x^3-1)/(x-1), f(1)=5, continuous at x=1?","steps":[{"prompt":"Simplify (x^3-1)/(x-1) for x != 1. What single expression does it reduce to?","hint":"Factor x^3 - 1 as a difference of cubes: (x-1)(x^2+x+1).","answer":"x^2 + x + 1, valid for x != 1."},{"prompt":"What is lim_{x to 1} f(x), and does it equal f(1) = 5?","hint":"Substitute x = 1 into the simplified expression x^2 + x + 1.","answer":"The limit is 1 + 1 + 1 = 3, which does NOT equal f(1) = 5 — condition (3) for continuity fails."},{"prompt":"Since the limit exists and is finite but disagrees with f(1), what type of discontinuity is this, and what value fixes it?","hint":"A finite, existing limit that just doesn't match f(a) is the removable case.","answer":"A removable discontinuity — redefining \\boxed{f(1)=3} makes f continuous at x=1."}]}
```
