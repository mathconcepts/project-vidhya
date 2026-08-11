---
id: random-variables.common-traps
concept_id: random-variables
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing PMF and PDF**: PMF applies to **discrete** random variables (sums to 1, evaluated at specific points), while PDF applies to **continuous** random variables (integrates to 1, evaluated over intervals). A student trying to compute $P(X = x)$ for a continuous RV gets 0 (the PDF at a single point has no area), which causes confusion.
- **Forgetting that PMF values sum to 1**: When finding the constant $c$ in a PMF like $p(x) = c \cdot x$, students sometimes forget to enforce $\sum p(x) = 1$. They just leave the answer in terms of $c$ instead of solving for it.
- **Misinterpreting CDF**: Students confuse $P(X \le x)$ with $P(X = x)$. The CDF is cumulative and monotonically non-decreasing; at a discrete point, $P(X = x) = F(x) - F(x^-)$ (the jump in the CDF).
