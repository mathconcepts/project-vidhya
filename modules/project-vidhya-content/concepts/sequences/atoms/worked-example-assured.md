---
# Alternative body for sequences.worked_example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: sequences.worked_example.assured
concept_id: sequences
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
scaffold_fade: true
variant_of: sequences.worked-example
for_stance: assured
---

For a rational sequence with numerator and denominator of equal degree, the limit is just the ratio of leading coefficients — $\frac31=3$ here, no division-by-$n^2$ bookkeeping needed once the degrees are compared.

**Answer (a):** the limit is $3$.

Boundedness above by $4$ reduces to one inequality, $n^2+18n+13>0$, true for every $n\ge1$ since all three terms are positive there — no case analysis needed.

**Answer (b):** bounded above by $4$ (and below by $a_1=\frac49>0$).

Checking $a_1<a_2$ numerically is a hint the sequence increases, never a proof — the actual argument needs $a_{n+1}-a_n>0$ established algebraically for *every* $n$, which is exactly what the sign of the combined numerator being positive for all $n\ge1$ establishes.

**Answer (c):** monotonically increasing.

The shortcut in (a) only survives equal degrees: if the denominator's degree exceeded the numerator's, the limit would be $0$ regardless of leading coefficients; if the numerator's degree were higher, the sequence would diverge to $\pm\infty$. Comparing degrees first is what makes the leading-coefficient trick valid at all, not a universal property of rational sequences.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: Limit of a rational sequence","steps":[{"prompt":"Step 1: To find the limit of $a_n = \\frac{3n^2 + 2n - 1}{n^2 + 5n + 3}$, divide numerator and denominator by the highest power of $n$ present. What is the highest power?","hint":"Look at both the numerator and denominator. The highest power in both is...?","answer":"$n^2$"},{"prompt":"Step 2: Rewrite the sequence as $\\frac{n^2(3 + \\frac{2}{n} - \\frac{1}{n^2})}{n^2(1 + \\frac{5}{n} + \\frac{3}{n^2})}$. Cancel the $n^2$ terms to get $\\frac{3 + \\frac{2}{n} - \\frac{1}{n^2}}{1 + \\frac{5}{n} + \\frac{3}{n^2}}$. As $n \\to \\infty$, what happens to fractions like $\\frac{1}{n}$ and $\\frac{1}{n^2}$?","hint":"What is $\\lim_{n \\to \\infty} \\frac{1}{n}$? What is $\\lim_{n \\to \\infty} \\frac{1}{n^2}$?","answer":"They both approach 0."},{"prompt":"Step 3: Apply the limit to the simplified expression: $\\lim_{n \\to \\infty} \\frac{3 + \\frac{2}{n} - \\frac{1}{n^2}}{1 + \\frac{5}{n} + \\frac{3}{n^2}} = \\frac{3 + 0 - 0}{1 + 0 + 0}$. What is this limit?","hint":"Substitute the limiting values of the fractional terms.","answer":"The limit is $\\frac{3}{1} = 3$. The sequence converges to 3."}],"caption":"Rational sequences converge to the ratio of leading coefficients. This trick works for all polynomial quotients where the numerator and denominator have the same degree."}
```
