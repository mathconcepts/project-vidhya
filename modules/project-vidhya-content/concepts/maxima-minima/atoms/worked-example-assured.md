---
# Alternative body for maxima-minima.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: maxima-minima.worked_example.assured
concept_id: maxima-minima
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: maxima-minima-worked-example
for_stance: assured
---

Closed-interval method, straight through: $f'(x)=3x(x-2)=0$ at $x=0,2$, both interior; candidates are $\{-1,0,2,3\}$. Evaluating: $f(-1)=0$, $f(0)=4$, $f(2)=0$, $f(3)=4$.

**Answer:** absolute maximum $4$ (at $x=0$ *and* $x=3$); absolute minimum $0$ (at $x=-1$ *and* $x=2$).

The mark-loser GATE specifically tests here: the maximum is achieved at two points, one interior critical point and one endpoint, and a question phrased "at what value of $x$?" expects both. Reporting only the critical point, or only the endpoint, drops half the correct answer.

The "no other critical points" check is not free: it holds here only because $f$ is a polynomial, hence differentiable everywhere. Swap in $f(x)=|x-1|$ on a similar interval and $f'$ fails to exist at $x=1$ — a genuine critical point that no derivative-equals-zero search would ever find. Skipping the existence check, not just the zero-derivative search, misses candidates like this entirely.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: absolute extrema of f(x) = x³ − 3x² + 4 on [−1, 3]","steps":[{"prompt":"Find f'(x) for f(x) = x³ − 3x² + 4.","hint":"Differentiate term by term using the power rule: d/dx[xⁿ] = n·xⁿ⁻¹.","answer":"f'(x) = 3x² − 6x"},{"prompt":"Set f'(x) = 0 and find the critical points. Factor 3x² − 6x first.","hint":"Factor out 3x from 3x² − 6x to get 3x(x − 2) = 0.","answer":"x = 0 and x = 2"},{"prompt":"Which candidates must you evaluate on the closed interval [−1, 3]?","hint":"The closed interval method requires critical points inside the interval PLUS both endpoints.","answer":"x = −1, x = 0, x = 2, and x = 3 (two critical points plus both endpoints)"},{"prompt":"Evaluate f at all four candidates and state the absolute maximum and minimum values.","hint":"f(−1)=0, f(0)=4, f(2)=0, f(3)=4. Compare all four values.","answer":"Absolute maximum = 4 (at x=0 and x=3); Absolute minimum = 0 (at x=−1 and x=2)"}]}
```
