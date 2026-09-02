---
id: regression-correlation.retrieval-prompt
concept_id: regression-correlation
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["R-squared", "sum-of-squares"]
---

Before checking: a dataset has 100 observations with $SS_T = 500$ (total sum of squares) and $SS_E = 125$ (residual sum of squares). From memory, what is the coefficient of determination $R^2$?

- **(A)** 0.75
- **(B)** 0.25
- **(C)** 0.50
- **(D)** 1.00

<details>
<summary>Answer</summary>

**A**. $SS_T = SS_R + SS_E$, so $SS_R = SS_T - SS_E = 500 - 125 = 375$. $R^2 = SS_R/SS_T = 375/500 = 0.75$ — 75% of the variance in $Y$ is explained by the regression model, and 25% remains unexplained ($SS_E$).

</details>
