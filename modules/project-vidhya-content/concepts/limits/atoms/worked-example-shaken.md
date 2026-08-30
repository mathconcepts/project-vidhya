---
# Alternative body for limits.worked_example, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: limits.worked_example.shaken
concept_id: limits
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: limits-worked-example
for_stance: shaken
---

**Given:** $\lim_{x\to1}\dfrac{x^2-1}{x-1}$.

**Step 1.** Try plugging in $x=1$ directly: $\dfrac{1-1}{1-1}=\dfrac00$ — indeterminate, can't stop here.

**Step 2.** Factor the numerator only: $x^2-1=(x-1)(x+1)$.

**Step 3.** Cancel $(x-1)$, valid since $x\neq1$ during the limit: $\dfrac{(x-1)(x+1)}{x-1}=x+1$.

**Step 4.** Take the limit of the simplified form: $\lim_{x\to1}(x+1)=1+1=2$.

**Answer:** $2$.

**Check it:** approach from the left at $x=0.99$: $x+1=1.99$. Approach from the right at $x=1.01$: $x+1=2.01$. Both are closing in on $2$ from opposite sides.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: evaluating lim (x^2-1)/(x-1) as x approaches 1","steps":[{"prompt":"Direct substitution in $\\lim_{x \\to 1} \\frac{x^2-1}{x-1}$ gives what form? Why can't we stop there?","hint":"Plug $x=1$ into both numerator and denominator separately.","answer":"We get $\\frac{0}{0}$, which is **indeterminate** — it carries no information about the true limit. We must simplify the expression before evaluating."},{"prompt":"After factoring and cancelling $(x-1)$, what is the simplified expression, and what is the final limit?","hint":"Factor $x^2 - 1$ as a difference of squares: $(x-1)(x+1)$.","answer":"The simplified expression is $x+1$ (valid for $x \\neq 1$). Substituting $x=1$ gives $\\lim_{x \\to 1}(x+1) = \\boxed{2}$."}]}
```
