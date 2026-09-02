---
id: regression-correlation.interleaved-drill
concept_id: regression-correlation
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: regression-correlation.micro-exercise
---

**Cross-concept check: regression & correlation → joint distributions.**

For a sample of $n=5$ pairs, $S_{xx}=10$, $S_{yy}=10$, $S_{xy}=8$ (the same data as the worked example: $\bar{x}=3,\bar{y}=5$).

**Question 1 (regression & correlation):** Find the least-squares slope $b$ for regressing $y$ on $x$.

*Answer:* $b=S_{xy}/S_{xx}=8/10=0.8$.

**Question 2 (joint distributions):** Treating $X,Y$ as random variables with sample covariance $\text{Cov}(X,Y)=S_{xy}/n=8/5=1.6$ and sample variances $\text{Var}(X)=S_{xx}/n=10/5=2$, $\text{Var}(Y)=S_{yy}/n=10/5=2$, compute the correlation $\rho(X,Y)$ and confirm it's consistent with $r=0.8$ from Question 1.

*Answer:* $\rho(X,Y)=\dfrac{\text{Cov}(X,Y)}{\sqrt{\text{Var}(X)\text{Var}(Y)}}=\dfrac{1.6}{\sqrt{2\times2}}=\dfrac{1.6}{2}=0.8$ — matches $r=0.8$ exactly, since the sample correlation coefficient IS $\rho(X,Y)$ computed on the empirical joint distribution of the data pairs.

**Why this drill exists:** "correlation coefficient" is taught once in regression-and-correlation as a formula over sums, and again in joint distributions as $\text{Cov}(X,Y)/(\sigma_X\sigma_Y)$ — students rarely notice these are the SAME quantity viewed from two chapters. Computing it both ways from one dataset closes that gap.
