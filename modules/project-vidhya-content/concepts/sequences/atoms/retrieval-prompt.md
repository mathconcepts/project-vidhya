---
id: sequences.retrieval-prompt
concept_id: sequences
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Consider the sequence $a_n = \left(1 + \frac{1}{n}\right)^n$. This sequence is:

- **(A)** Monotone decreasing and diverges
- **(B)** Monotone increasing and converges to $e$
- **(C)** Oscillating and converges to $e$
- **(D)** Monotone increasing and diverges to $\infty$

<details>
<summary>Answer</summary>

**B**. The sequence $a_n = \left(1 + \frac{1}{n}\right)^n$ is a classic sequence.

Monotonicity: We can show using calculus that this sequence is strictly increasing. By Bernoulli's inequality or direct verification:
- $a_1 = 2$
- $a_2 = (1.5)^2 = 2.25$
- $a_3 = (4/3)^3 \approx 2.370$
- $a_{10} \approx 2.594$
- $a_{100} \approx 2.7048$

The sequence is monotone increasing.

Convergence: By definition, $\lim_{n \to \infty} \left(1 + \frac{1}{n}\right)^n = e \approx 2.71828...$

The sequence is monotone increasing and converges to $e$.

</details>
