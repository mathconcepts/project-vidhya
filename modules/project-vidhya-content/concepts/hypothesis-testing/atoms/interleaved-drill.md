---
id: hypothesis-testing.interleaved-drill
concept_id: hypothesis-testing
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: hypothesis-testing.worked-example
---

**Cross-concept check: hypothesis testing → sampling distributions.**

A sample of $n=16$ observations from a normal population, $\sigma$ unknown, gives $\bar{x}=52$ and sample standard deviation $s=8$. (Given: $t_{0.025,15}=2.131$.)

**Question 1 (sampling distributions):** Which distribution governs $\dfrac{\bar{X}-\mu}{s/\sqrt{n}}$ here, and what is the resulting 95% confidence interval for $\mu$?

*Answer:* $\sigma$ is unknown, so Student's $t$ with $df=n-1=15$. Standard error $SE=s/\sqrt{n}=8/4=2$. Margin of error $=t_{0.025,15}\cdot SE=2.131\times2=4.262$. CI $=52\pm4.262=(47.738,\ 56.262)$.

**Question 2 (hypothesis testing):** Using the same sample, test $H_0:\mu=50$ against $H_1:\mu\ne50$ at $\alpha=0.05$. What is the decision, and how does it relate to the interval in Question 1?

*Answer:* $t=\dfrac{\bar{x}-\mu_0}{SE}=\dfrac{52-50}{2}=1.0$. Since $|1.0|<t_{0.025,15}=2.131$, **fail to reject $H_0$**. This matches the interval: $\mu_0=50$ lies **inside** $(47.738,56.262)$, and a $(1-\alpha)$ confidence interval containing $\mu_0$ is exactly equivalent to "fail to reject $H_0:\mu=\mu_0$" at level $\alpha$ — the same computation, read two ways.

**Why this drill exists:** students learn confidence intervals and hypothesis tests as two separate procedures with two separate formulas, and miss that they are duals of each other built from the identical standard error and critical value. Seeing both computed from one sample makes the equivalence concrete instead of a memorized rule.
