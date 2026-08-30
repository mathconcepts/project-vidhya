---
# Alternative body for limits.worked_example, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: limits.worked_example.assured
concept_id: limits
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: limits-worked-example
for_stance: assured
---

$\frac{x^2-1}{x-1}$ is a difference-of-squares $\frac00$ hiding a cancelable factor: $(x-1)(x+1)/(x-1)=x+1$, so the limit is $x+1$ evaluated at $1$, giving $2$ — no need to write out the indeterminate-form check as a separate labeled step.

**Answer:** $2$.

The pattern generalizes completely: $\lim_{x\to a}\dfrac{x^n-a^n}{x-a}=na^{n-1}$ for any positive integer $n$ — this is just the derivative of $x^n$ at $a$ read off the definition of the derivative itself, $\lim_{x\to a}\frac{f(x)-f(a)}{x-a}=f'(a)$, with no factoring needed once that connection is made.

The condition that limits this shortcut: the numerator must factor as an exact polynomial difference in $x-a$. A form like $\lim_{x\to1}\frac{\sqrt x-1}{x-1}$ is the *same* $\frac00$ shape but the numerator is not a polynomial, so plain factoring fails — rationalizing (multiply by $\sqrt x+1$) or recognizing it as $f'(1)$ for $f(x)=\sqrt x$ are the correct routes there, not forcing a factorization that does not exist.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: evaluating lim (x^2-1)/(x-1) as x approaches 1","steps":[{"prompt":"Direct substitution in $\\lim_{x \\to 1} \\frac{x^2-1}{x-1}$ gives what form? Why can't we stop there?","hint":"Plug $x=1$ into both numerator and denominator separately.","answer":"We get $\\frac{0}{0}$, which is **indeterminate** — it carries no information about the true limit. We must simplify the expression before evaluating."},{"prompt":"After factoring and cancelling $(x-1)$, what is the simplified expression, and what is the final limit?","hint":"Factor $x^2 - 1$ as a difference of squares: $(x-1)(x+1)$.","answer":"The simplified expression is $x+1$ (valid for $x \\neq 1$). Substituting $x=1$ gives $\\lim_{x \\to 1}(x+1) = \\boxed{2}$."}]}
```
