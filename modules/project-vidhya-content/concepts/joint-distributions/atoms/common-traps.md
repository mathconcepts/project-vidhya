---
id: joint-distributions.common-traps
concept_id: joint-distributions
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing joint and marginal**: Students read off a joint probability table and report $p(x, y)$ directly instead of summing over the other variable to get the marginal $p_X(x) = \sum_y p(x, y)$. The marginal is a column/row sum, not a cell value.
- **Forgetting to divide by the marginal for conditional probability**: The conditional PMF is $p(y|x) = \frac{p(x,y)}{p_X(x)}$, but students sometimes report $p(x, y)$ as the conditional (which is missing the denominator).
- **Thinking independence means covariance is always zero**: While independence ⟹ Cov = 0, the converse is false. Cov = 0 does NOT guarantee independence. This is a subtle point GATE loves to test via "false implies" style questions.
