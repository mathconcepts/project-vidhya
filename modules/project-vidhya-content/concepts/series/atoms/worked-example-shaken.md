---
# Alternative body for series.worked_example, served when the learner
# stance is `shaken`. Same steps, concrete-first, full arithmetic.
id: series.worked_example.shaken
concept_id: series
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: series.worked_example
for_stance: shaken
---

Same problem: $\sum_{n=1}^{\infty} \dfrac{n}{2^n}$. Same numbers, one step at a time.

**Step 1.** Ratio test: $\dfrac{a_{n+1}}{a_n}=\dfrac{(n+1)/2^{n+1}}{n/2^n}=\dfrac{n+1}{2n}$.

$$
L=\lim_{n\to\infty}\frac{n+1}{2n}=\frac12
$$

$L=\dfrac12<1$, so the series converges.

**Step 2.** Use $\sum n x^n = \dfrac{x}{(1-x)^2}$ with $x=\dfrac12$:

$$
\sum_{n=1}^{\infty}\frac{n}{2^n}=\frac{\frac12}{\left(\frac12\right)^2}=\frac{0.5}{0.25}
$$

$$
\boxed{\sum_{n=1}^{\infty}\frac{n}{2^n}=2}
$$

**Check.** Add terms directly: $S_4=0.5+0.5+0.375+0.25=1.625$. $S_5=1.625+0.15625=1.78125$. Climbing toward $2$, steps shrinking — consistent.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: does sum n/2^n converge, and to what?","steps":[{"prompt":"Apply the ratio test to a_n = n/2^n. What is L = lim |a_{n+1}/a_n|?","hint":"Write a_{n+1}/a_n and simplify the powers of 2.","answer":"a_{n+1}/a_n = (n+1)/(2n), so L = lim (n+1)/(2n) = 1/2."},{"prompt":"L = 1/2 < 1. What does the ratio test conclude?","hint":"Compare L against 1.","answer":"The series converges (absolutely), since L < 1."},{"prompt":"Using sum n x^n = x/(1-x)^2 at x = 1/2, what is the sum?","hint":"Substitute x = 1/2 and simplify the fraction of fractions.","answer":"sum n/2^n = (1/2)/(1/2)^2 = (1/2)/(1/4) = \\boxed{2}."}]}
```
