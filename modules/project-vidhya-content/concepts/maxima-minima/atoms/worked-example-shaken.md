---
# Alternative body for maxima-minima.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: maxima-minima.worked_example.shaken
concept_id: maxima-minima
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: maxima-minima-worked-example
for_stance: shaken
---

**Given:** $f(x)=x^3-3x^2+4$ on $[-1,3]$. Find the absolute maximum and minimum.

**Step 1.** Find the derivative only: $f'(x)=3x^2-6x$.

**Step 2.** Factor it: $f'(x)=3x(x-2)$.

**Step 3.** Set it to zero: $3x(x-2)=0$, so $x=0$ or $x=2$.

**Step 4.** Check both lie inside $(-1,3)$: yes, both do.

**Step 5.** Check $f'$ exists everywhere on $[-1,3]$: yes, it's a polynomial, so there are no other critical points to add.

**Step 6.** List every candidate: the two critical points, $x=0$ and $x=2$, plus the two endpoints, $x=-1$ and $x=3$.

**Step 7.** Evaluate $f$ at each candidate, one at a time. At $x=-1$: $f(-1)=(-1)^3-3(-1)^2+4=-1-3+4=0$. At $x=0$: $f(0)=0-0+4=4$. At $x=2$: $f(2)=8-12+4=0$. At $x=3$: $f(3)=27-27+4=4$.

**Step 8.** Compare the four values: $0,4,0,4$. The largest is $4$; the smallest is $0$.

**Answer:** absolute maximum $4$ at $x=0$ and $x=3$; absolute minimum $0$ at $x=-1$ and $x=2$.

**Check it:** the second derivative is $f''(x)=6x-6$. At $x=0$: $f''(0)=-6<0$, confirming a local peak there, matching the value $4$. At $x=2$: $f''(2)=6>0$, confirming a local valley, matching the value $0$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: absolute extrema of f(x) = x³ − 3x² + 4 on [−1, 3]","steps":[{"prompt":"Find f'(x) for f(x) = x³ − 3x² + 4.","hint":"Differentiate term by term using the power rule: d/dx[xⁿ] = n·xⁿ⁻¹.","answer":"f'(x) = 3x² − 6x"},{"prompt":"Set f'(x) = 0 and find the critical points. Factor 3x² − 6x first.","hint":"Factor out 3x from 3x² − 6x to get 3x(x − 2) = 0.","answer":"x = 0 and x = 2"},{"prompt":"Which candidates must you evaluate on the closed interval [−1, 3]?","hint":"The closed interval method requires critical points inside the interval PLUS both endpoints.","answer":"x = −1, x = 0, x = 2, and x = 3 (two critical points plus both endpoints)"},{"prompt":"Evaluate f at all four candidates and state the absolute maximum and minimum values.","hint":"f(−1)=0, f(0)=4, f(2)=0, f(3)=4. Compare all four values.","answer":"Absolute maximum = 4 (at x=0 and x=3); Absolute minimum = 0 (at x=−1 and x=2)"}]}
```
