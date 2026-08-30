---
# Alternative body for partial-fractions.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: partial-fractions.worked_example.shaken
concept_id: partial-fractions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: partial-fractions-worked-example
for_stance: shaken
---

**Given:** $\int\dfrac{x+1}{(x-2)(x+3)}\,dx$.

**Step 1.** Write the template: $\dfrac{x+1}{(x-2)(x+3)}=\dfrac{A}{x-2}+\dfrac{B}{x+3}$.

**Step 2.** Clear denominators: $x+1=A(x+3)+B(x-2)$.

**Step 3.** Plug in $x=2$ (kills $B$): $2+1=A(2+3)$, so $3=5A$, giving $A=\dfrac35$.

**Step 4.** Plug in $x=-3$ (kills $A$): $-3+1=B(-3-2)$, so $-2=-5B$, giving $B=\dfrac25$.

**Step 5.** Write the decomposition: $\dfrac{3/5}{x-2}+\dfrac{2/5}{x+3}$.

**Step 6.** Integrate each piece separately: $\dfrac35\int\dfrac{dx}{x-2}+\dfrac25\int\dfrac{dx}{x+3}$.

**Answer:** $\dfrac35\ln|x-2|+\dfrac25\ln|x+3|+C$.

**Check it:** add $\dfrac{3/5}{x-2}+\dfrac{2/5}{x+3}$ back over a common denominator: $\dfrac{3(x+3)+2(x-2)}{5(x-2)(x+3)}=\dfrac{5x+5}{5(x-2)(x+3)}=\dfrac{x+1}{(x-2)(x+3)}$. Matches the original.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: partial fractions of (x+1)/[(x−2)(x+3)]","steps":[{"prompt":"What is the correct partial fraction template for (x+1)/[(x-2)(x+3)]?","hint":"Two distinct linear factors → one constant term per factor: A/(x-2) + B/(x+3).","answer":"A/(x-2) + B/(x+3), because the denominator has two distinct linear factors, each requiring one constant numerator."},{"prompt":"Using the cover-up rule, what is the value of A (the constant over the x-2 factor)?","hint":"Cover (x-2) in the denominator, then substitute x=2 into the rest of the fraction.","answer":"A = (2+1)/(2+3) = 3/5. Cover (x-2), evaluate (x+1)/(x+3) at x=2: 3/5."},{"prompt":"What is the final integrated result?","hint":"Integrate A/(x-2) and B/(x+3) separately — each gives a natural log.","answer":"(3/5)ln|x-2| + (2/5)ln|x+3| + C. Each term 1/(x-a) integrates to ln|x-a|."}]}
```
