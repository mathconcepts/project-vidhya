---
id: joint-distributions.micro-exercise
concept_id: joint-distributions
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Two random variables $X$ and $Y$ have the joint PMF given by the table:
\begin{array}{c|cc} & Y=1 & Y=2 \\ \hline X=1 & 0.2 & 0.3 \\ X=2 & 0.1 & 0.4 \end{array}
What is the marginal probability $P(X = 1)$?

- **(A)** 0.5
- **(B)** 0.2
- **(C)** 0.3
- **(D)** 0.6

<details>
<summary>Answer</summary>

**A**. The marginal probability $P(X = 1)$ is obtained by summing the joint PMF over all values of $Y$:

$$P(X = 1) = \sum_y P(X = 1, Y = y) = P(X=1, Y=1) + P(X=1, Y=2)$$
$$= 0.2 + 0.3 = 0.5$$

We can verify the marginal for $X = 2$:
$$P(X = 2) = 0.1 + 0.4 = 0.5$$

And the total: $0.5 + 0.5 = 1$ ✓ (as required for a valid PMF).

</details>
