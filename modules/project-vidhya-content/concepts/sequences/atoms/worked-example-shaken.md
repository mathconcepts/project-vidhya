---
# Alternative body for sequences.worked_example, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: sequences.worked_example.shaken
concept_id: sequences
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: sequences.worked-example
for_stance: shaken
---

**Given:** $a_n=\dfrac{3n^2+2n-1}{n^2+5n+3}$.

**(a) Find the limit.**

**Step 1.** Divide every term by the highest power, $n^2$: $a_n=\dfrac{3+\frac2n-\frac1{n^2}}{1+\frac5n+\frac3{n^2}}$.

**Step 2.** Let $n\to\infty$: every fraction with $n$ in the denominator goes to $0$.

**Step 3.** What's left: $\dfrac{3+0-0}{1+0+0}=3$.

**Answer (a):** the limit is $3$.

**(b) Show $a_n<4$ for all $n\ge1$.**

**Step 4.** Since the denominator is positive for $n\ge1$, multiply both sides of $a_n<4$ by it: $3n^2+2n-1<4(n^2+5n+3)$.

**Step 5.** Expand the right side: $3n^2+2n-1<4n^2+20n+12$.

**Step 6.** Move everything to one side: $0<n^2+18n+13$.

**Step 7.** Check it's true for $n\ge1$: at $n=1$, $1+18+13=32>0$, and it only grows from there.

**Answer (b):** $a_n<4$ for every $n\ge1$.

**(c) Is the sequence increasing?**

**Step 8.** Compute $a_1=\dfrac{3+2-1}{1+5+3}=\dfrac49$.

**Step 9.** Compute $a_2=\dfrac{12+4-1}{4+10+3}=\dfrac{15}{17}$.

**Step 10.** Compare: $\dfrac49\approx0.44$ and $\dfrac{15}{17}\approx0.88$ — the second term is bigger than the first.

**Answer (c):** the sequence is increasing, climbing toward its limit of $3$ from below.

**Check it:** an increasing sequence that stays below $4$ forever can't overshoot its limit — matching a limit of $3$, safely under the $4$ ceiling.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Limit of a rational sequence","steps":[{"prompt":"Step 1: To find the limit of $a_n = \\frac{3n^2 + 2n - 1}{n^2 + 5n + 3}$, divide numerator and denominator by the highest power of $n$ present. What is the highest power?","hint":"Look at both the numerator and denominator. The highest power in both is...?","answer":"$n^2$"},{"prompt":"Step 2: Rewrite the sequence as $\\frac{n^2(3 + \\frac{2}{n} - \\frac{1}{n^2})}{n^2(1 + \\frac{5}{n} + \\frac{3}{n^2})}$. Cancel the $n^2$ terms to get $\\frac{3 + \\frac{2}{n} - \\frac{1}{n^2}}{1 + \\frac{5}{n} + \\frac{3}{n^2}}$. As $n \\to \\infty$, what happens to fractions like $\\frac{1}{n}$ and $\\frac{1}{n^2}$?","hint":"What is $\\lim_{n \\to \\infty} \\frac{1}{n}$? What is $\\lim_{n \\to \\infty} \\frac{1}{n^2}$?","answer":"They both approach 0."},{"prompt":"Step 3: Apply the limit to the simplified expression: $\\lim_{n \\to \\infty} \\frac{3 + \\frac{2}{n} - \\frac{1}{n^2}}{1 + \\frac{5}{n} + \\frac{3}{n^2}} = \\frac{3 + 0 - 0}{1 + 0 + 0}$. What is this limit?","hint":"Substitute the limiting values of the fractional terms.","answer":"The limit is $\\frac{3}{1} = 3$. The sequence converges to 3."}],"caption":"Rational sequences converge to the ratio of leading coefficients. This trick works for all polynomial quotients where the numerator and denominator have the same degree."}
```
