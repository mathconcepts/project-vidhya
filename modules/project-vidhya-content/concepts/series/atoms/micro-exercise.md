---
id: series.micro-exercise
concept_id: series
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

The series $\sum_{n=1}^{\infty} \frac{1}{2^n}$ converges to:

- **(A)** $1$
- **(B)** $2$
- **(C)** $\frac{1}{2}$
- **(D)** $\infty$

<details>
<summary>Answer</summary>

**A**. This is a geometric series with first term $a = 1/2$ and common ratio $r = 1/2$.

Since $|r| = 1/2 < 1$, the series converges to:
$$S = \frac{a}{1-r} = \frac{1/2}{1 - 1/2} = \frac{1/2}{1/2} = 1$$

Alternatively, compute partial sums:
$$S_n = \frac{1}{2} + \frac{1}{4} + \cdots + \frac{1}{2^n} = 1 - \frac{1}{2^n}$$
$$\lim_{n \to \infty} S_n = 1 - 0 = 1$$

</details>
