---
# Alternative body for sequences.worked_example, served when the learner
# stance is `assured`. The fenced walkthrough is copied verbatim from the
# base atom so the widget cannot drift between variants.
id: sequences.worked_example.assured
concept_id: sequences
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: sequences.worked_example
for_stance: assured
---

Same proof, tightened to the one distinction worth remembering: the Monotone Convergence Theorem is **sufficient, not necessary**. Plenty of convergent sequences aren't monotonic at all — $a_n=(-1)^n/n$ flips sign every step and still converges to $0$, since $|a_n-0|\to 0$ regardless of sign. Monotonicity is a *route* to proving convergence when the limit can't be guessed in advance; it is not a requirement convergence itself imposes.

For $a_n=\dfrac{n}{n+1}$: increasing (the numerator of $a_{n+1}-a_n$ collapses to $1$) and bounded above by $1$ $\Rightarrow$ converges, by MCT, before the value is even known.

$$
a_n = \frac{n}{n+1} = \frac{1}{1+\frac{1}{n}} \;\Rightarrow\; \boxed{\lim_{n\to\infty}\frac{n}{n+1}=1}
$$

The trap this problem sets: computing a handful of terms and eyeballing "looks like it's heading to $1$" is not a proof — MCT, or the algebraic rewrite above, is what earns the mark.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: does a_n = n/(n+1) converge?","steps":[{"prompt":"Is a_n = n/(n+1) bounded? Find the bounds.","hint":"Compare n against n+1.","answer":"Yes: 0 < a_n < 1 for every n, since n < n+1."},{"prompt":"Is a_n increasing? Compute a_{n+1} - a_n.","hint":"Combine over the common denominator (n+1)(n+2).","answer":"a_{n+1} - a_n = 1/[(n+1)(n+2)] > 0, so the sequence is strictly increasing."},{"prompt":"Bounded above and increasing — what does the Monotone Convergence Theorem give, and what is the limit?","hint":"Rewrite a_n as 1/(1 + 1/n) and let n go to infinity.","answer":"The sequence converges by the Monotone Convergence Theorem, and the limit is \\boxed{1}."}]}
```
