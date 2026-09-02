---
# Alternative body for sequences.worked_example, served when the learner
# stance is `shaken`. Same steps, concrete-first, explicit check.
id: sequences.worked_example.shaken
concept_id: sequences
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: sequences.worked_example
for_stance: shaken
---

Same problem: $a_n = \dfrac{n}{n+1}$. Same numbers, one small step at a time.

**Step 1.** $n<n+1$ for every $n$, so $0<\dfrac{n}{n+1}<1$. Bounded.

**Step 2.**
$$
a_{n+1}-a_n=\frac{(n+1)^2-n(n+2)}{(n+1)(n+2)}
$$
Expand the numerator: $(n+1)^2=n^2+2n+1$ and $n(n+2)=n^2+2n$. Subtract: $1$. So
$$
a_{n+1}-a_n=\frac{1}{(n+1)(n+2)}>0.
$$
Increasing.

**Step 3.** Bounded above and increasing $\Rightarrow$ converges, by the Monotone Convergence Theorem. This alone proves a limit exists.

**Step 4.** $a_n=\dfrac{n}{n+1}=\dfrac{1}{1+\frac{1}{n}}$. As $n\to\infty$, $\dfrac1n\to0$, so
$$
\boxed{\lim_{n\to\infty}\frac{n}{n+1}=1}
$$

**Check.** $a_{1000}=\dfrac{1000}{1001}\approx0.999001$, closer to $1$ than $a_{100}\approx0.990099$ — consistent with an increasing sequence heading to $1$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: does a_n = n/(n+1) converge?","steps":[{"prompt":"Is a_n = n/(n+1) bounded? Find the bounds.","hint":"Compare n against n+1.","answer":"Yes: 0 < a_n < 1 for every n, since n < n+1."},{"prompt":"Is a_n increasing? Compute a_{n+1} - a_n.","hint":"Combine over the common denominator (n+1)(n+2).","answer":"a_{n+1} - a_n = 1/[(n+1)(n+2)] > 0, so the sequence is strictly increasing."},{"prompt":"Bounded above and increasing — what does the Monotone Convergence Theorem give, and what is the limit?","hint":"Rewrite a_n as 1/(1 + 1/n) and let n go to infinity.","answer":"The sequence converges by the Monotone Convergence Theorem, and the limit is \\boxed{1}."}]}
```
