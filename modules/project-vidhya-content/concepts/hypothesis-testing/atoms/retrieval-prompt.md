---
id: hypothesis-testing.retrieval-prompt
concept_id: hypothesis-testing
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["p-value", "decision-rule"]
---

Before checking: a hypothesis test has $H_0: \mu = 100$ and $H_1: \mu > 100$ at $\alpha = 0.05$. The critical value for a one-tailed $z$-test is $z_{0.05} = 1.645$. If the computed test statistic is $z = 1.5$, what is the decision, from memory?

- **(A)** Reject $H_0$
- **(B)** Fail to reject $H_0$
- **(C)** The test is inconclusive
- **(D)** Reject $H_1$

<details>
<summary>Answer</summary>

**B**. For a one-tailed test with $H_1: \mu > 100$ (right-tailed): critical value $z_{0.05}=1.645$, decision rule "reject $H_0$ if $z>1.645$." Given $z=1.5$: $1.5<1.645$, so we **fail to reject $H_0$** — at the 5% significance level, there is insufficient evidence to conclude $\mu>100$.

</details>
