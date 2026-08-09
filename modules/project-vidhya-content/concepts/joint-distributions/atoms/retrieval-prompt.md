---
id: joint-distributions.retrieval-prompt
concept_id: joint-distributions
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
---

Two random variables $X$ and $Y$ are independent with $E[X] = 2$, $\text{Var}(X) = 1$, $E[Y] = 3$, and $\text{Var}(Y) = 4$. What is $\text{Cov}(X, Y)$?

- **(A)** 0
- **(B)** 1
- **(C)** 2
- **(D)** 3

<details>
<summary>Answer</summary>

**A**. If two random variables are independent, their covariance is zero:
$$\text{Cov}(X, Y) = 0$$

This is a fundamental property: independence implies zero covariance. (However, the converse is not always true: zero covariance does not necessarily imply independence.)

Alternatively, using the definition:
$$\text{Cov}(X, Y) = E[XY] - E[X]E[Y]$$

If $X$ and $Y$ are independent, then $E[XY] = E[X]E[Y]$, so:
$$\text{Cov}(X, Y) = E[X]E[Y] - E[X]E[Y] = 0$$

</details>
