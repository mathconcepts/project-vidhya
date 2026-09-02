---
id: sequences.worked_example
concept_id: sequences
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** Show that $a_n = \dfrac{n}{n+1}$ converges, and find its limit.

There is no need to guess the limit first — boundedness plus monotonicity will prove convergence exists, and a small algebraic rewrite will hand over the exact value.

---

**Step 1 — Check boundedness.**

For every $n\ge 1$, $n < n+1$, so $0 < \dfrac{n}{n+1} < 1$. The sequence is bounded between $0$ and $1$.

---

**Step 2 — Check monotonicity.**

$$
a_{n+1}-a_n=\frac{n+1}{n+2}-\frac{n}{n+1}=\frac{(n+1)^2-n(n+2)}{(n+2)(n+1)}
$$

The numerator is $(n^2+2n+1)-(n^2+2n)=1$, so

$$
a_{n+1}-a_n=\frac{1}{(n+1)(n+2)}>0 \quad \text{for all } n\ge 1.
$$

The sequence is strictly increasing.

---

**Step 3 — Apply the Monotone Convergence Theorem.**

Bounded above by $1$ and strictly increasing $\Rightarrow$ the sequence converges. This step alone guarantees a limit exists, before its value is even computed.

---

**Step 4 — Find the value.**

Rewrite $a_n = \dfrac{n}{n+1} = \dfrac{1}{1+\frac{1}{n}}$. As $n\to\infty$, $\dfrac{1}{n}\to 0$, so

$$
\boxed{\lim_{n\to\infty}\frac{n}{n+1}=1}
$$

---

**Sanity check.** $a_{1000} = \dfrac{1000}{1001}\approx 0.999001$ — closer to $1$ than $a_{100}=\dfrac{100}{101}\approx0.990099$, exactly as an increasing sequence approaching $1$ should be.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: does a_n = n/(n+1) converge?","steps":[{"prompt":"Is a_n = n/(n+1) bounded? Find the bounds.","hint":"Compare n against n+1.","answer":"Yes: 0 < a_n < 1 for every n, since n < n+1."},{"prompt":"Is a_n increasing? Compute a_{n+1} - a_n.","hint":"Combine over the common denominator (n+1)(n+2).","answer":"a_{n+1} - a_n = 1/[(n+1)(n+2)] > 0, so the sequence is strictly increasing."},{"prompt":"Bounded above and increasing — what does the Monotone Convergence Theorem give, and what is the limit?","hint":"Rewrite a_n as 1/(1 + 1/n) and let n go to infinity.","answer":"The sequence converges by the Monotone Convergence Theorem, and the limit is \\boxed{1}."}]}
```
