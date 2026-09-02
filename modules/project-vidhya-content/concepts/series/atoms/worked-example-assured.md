---
# Alternative body for series.worked_example, served when the learner
# stance is `assured`. The fenced walkthrough is copied verbatim from the
# base atom so the widget cannot drift between variants.
id: series.worked_example.assured
concept_id: series
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: series.worked_example
for_stance: assured
---

Ratio test on $a_n=\dfrac{n}{2^n}$: $\dfrac{a_{n+1}}{a_n}=\dfrac{n+1}{2n}\to\dfrac12<1\Rightarrow$ converges absolutely — routine so far.

What the ratio test never gives you: its $L$ only ever certifies convergence; it never hands over the sum. Getting the value needs a **separate** closed-form identity, here $\sum n x^n=\dfrac{x}{(1-x)^2}$ for $|x|<1$:

$$
\sum_{n=1}^{\infty}\frac{n}{2^n}=\frac{1/2}{(1/2)^2}=\boxed{2}
$$

Conflating "I found $L<1$" with "I found the sum" is a common shortcut students take under time pressure — GATE NAT questions asking for the numeric sum specifically require this second step, not just the convergence verdict.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: does sum n/2^n converge, and to what?","steps":[{"prompt":"Apply the ratio test to a_n = n/2^n. What is L = lim |a_{n+1}/a_n|?","hint":"Write a_{n+1}/a_n and simplify the powers of 2.","answer":"a_{n+1}/a_n = (n+1)/(2n), so L = lim (n+1)/(2n) = 1/2."},{"prompt":"L = 1/2 < 1. What does the ratio test conclude?","hint":"Compare L against 1.","answer":"The series converges (absolutely), since L < 1."},{"prompt":"Using sum n x^n = x/(1-x)^2 at x = 1/2, what is the sum?","hint":"Substitute x = 1/2 and simplify the fraction of fractions.","answer":"sum n/2^n = (1/2)/(1/2)^2 = (1/2)/(1/4) = \\boxed{2}."}]}
```
