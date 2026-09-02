---
id: series.worked_example
concept_id: series
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Determine whether $\sum_{n=1}^{\infty} \dfrac{n}{2^n}$ converges, and if it does, find its sum.

---

**Step 1 — Apply the ratio test.**

$$
\frac{a_{n+1}}{a_n} = \frac{(n+1)/2^{n+1}}{n/2^{n}} = \frac{n+1}{2n}
$$

$$
L = \lim_{n\to\infty}\frac{n+1}{2n} = \frac12
$$

Since $L=\dfrac12<1$, the series **converges** (absolutely).

---

**Step 2 — Find the sum.**

Convergence alone doesn't hand over the value — use the standard identity $\displaystyle\sum_{n=1}^{\infty} n x^n = \dfrac{x}{(1-x)^2}$ for $|x|<1$, with $x=\dfrac12$:

$$
\sum_{n=1}^{\infty}\frac{n}{2^n} = \frac{\frac12}{\left(1-\frac12\right)^2} = \frac{\frac12}{\frac14}
$$

$$
\boxed{\sum_{n=1}^{\infty}\frac{n}{2^n}=2}
$$

---

**Sanity check.** $S_4 = \dfrac12+\dfrac{2}{4}+\dfrac{3}{8}+\dfrac{4}{16}=0.5+0.5+0.375+0.25=1.625$, and $S_5$ adds $\dfrac{5}{32}=0.15625$ to give $1.78125$ — climbing toward $2$ with shrinking steps, exactly as an increasing partial-sum sequence bounded above should.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: does sum n/2^n converge, and to what?","steps":[{"prompt":"Apply the ratio test to a_n = n/2^n. What is L = lim |a_{n+1}/a_n|?","hint":"Write a_{n+1}/a_n and simplify the powers of 2.","answer":"a_{n+1}/a_n = (n+1)/(2n), so L = lim (n+1)/(2n) = 1/2."},{"prompt":"L = 1/2 < 1. What does the ratio test conclude?","hint":"Compare L against 1.","answer":"The series converges (absolutely), since L < 1."},{"prompt":"Using sum n x^n = x/(1-x)^2 at x = 1/2, what is the sum?","hint":"Substitute x = 1/2 and simplify the fraction of fractions.","answer":"sum n/2^n = (1/2)/(1/2)^2 = (1/2)/(1/4) = \\boxed{2}."}]}
```
