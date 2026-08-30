---
# Alternative body for continuity.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: continuity.worked_example.shaken
concept_id: continuity
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: continuity-worked-example
for_stance: shaken
---

**Given:** is $f(x)=\dfrac{x^2-4}{x-2}$ continuous at $x=2$?

**Step 1.** Plug $x=2$ into $f$ directly: $f(2)=\dfrac{4-4}{2-2}=\dfrac{0}{0}$ — undefined. Condition 1 already fails.

**Step 2.** Factor the numerator only: $x^2-4=(x-2)(x+2)$.

**Step 3.** Cancel the common factor, valid since $x\neq2$: $\dfrac{(x-2)(x+2)}{x-2}=x+2$.

**Step 4.** Take the limit of the simplified form: $\lim_{x\to2}(x+2)=4$. The limit exists.

**Step 5.** Compare: the limit is $4$, but $f(2)$ doesn't exist, so they cannot agree. Condition 3 fails.

**Answer:** $f$ is discontinuous at $x=2$ — a removable discontinuity, since redefining $f(2)=4$ patches it.

**Check it:** redefine $\tilde f(2)=4$ and recompute the limit at $x=2$ — still $4$, so $\tilde f$ now matches its own value there. The hole was exactly one point wide.

---

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: classifying the removable discontinuity at x = 2","steps":[{"prompt":"Apply the three-condition checklist to $f(x) = \\frac{x^2-4}{x-2}$ at $x=2$. Which condition fails first, and why?","hint":"Substitute $x=2$ directly into the formula. What happens to the denominator?","answer":"**Condition 1 fails.** $f(2) = \\frac{0}{0}$ is undefined — the denominator is zero, so the function is not defined at $x=2$."},{"prompt":"Even though $f(2)$ is undefined, compute $\\lim_{x \\to 2} f(x)$ and name the type of discontinuity.","hint":"Factor $x^2-4 = (x-2)(x+2)$ and cancel the $(x-2)$ term before substituting.","answer":"$\\lim_{x \\to 2}(x+2) = 4$. The limit exists, but $f(2)$ is undefined, so this is a **removable discontinuity**. Redefining $f(2)=4$ makes the function continuous."}]}
```
