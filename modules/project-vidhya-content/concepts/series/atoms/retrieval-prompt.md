---
id: series.retrieval-prompt
concept_id: series
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Test the convergence of $\sum_{n=1}^{\infty} \frac{3n + 1}{n^3 + 2n}$ using the limit comparison test with $\frac{1}{n^2}$.

- **(A)** The series diverges because the limit is 0
- **(B)** The series converges because the limit is finite and positive
- **(C)** The series diverges because the limit is infinite
- **(D)** The test is inconclusive

<details>
<summary>Answer</summary>

**B**. Apply the **Limit Comparison Test** with comparison series $b_n = 1/n^2$ (which converges).

Compute:
$$\lim_{n \to \infty} \frac{a_n}{b_n} = \lim_{n \to \infty} \frac{\frac{3n+1}{n^3+2n}}{\frac{1}{n^2}} = \lim_{n \to \infty} \frac{3n+1}{n^3+2n} \cdot n^2$$

$$= \lim_{n \to \infty} \frac{(3n+1)n^2}{n^3+2n} = \lim_{n \to \infty} \frac{3n^3 + n^2}{n^3 + 2n}$$

Divide by $n^3$:
$$= \lim_{n \to \infty} \frac{3 + 1/n}{1 + 2/n^2} = \frac{3}{1} = 3$$

Since the limit is finite and positive ($L = 3$), and $\sum 1/n^2$ converges, the original series also converges.

</details>
