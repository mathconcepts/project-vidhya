---
id: joint-distributions.interleaved-drill
concept_id: joint-distributions
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: joint-distributions.micro-exercise
---

**Cross-concept check: joint distributions → regression & correlation.**

Two 0/1-valued random variables $X, Y$ have joint PMF $p(0,0)=0.4,\ p(0,1)=0.1,\ p(1,0)=0.1,\ p(1,1)=0.4$.

**Question 1 (joint distributions):** Find $\text{Cov}(X,Y)$.

*Answer:* Marginals: $P(X=1)=p(1,0)+p(1,1)=0.5$, and by symmetry $P(Y=1)=0.5$. Since $X,Y\in\{0,1\}$, $E[X]=E[X^2]=0.5$ and likewise for $Y$. $E[XY]=1\cdot1\cdot p(1,1)=0.4$. So $\text{Cov}(X,Y)=E[XY]-E[X]E[Y]=0.4-0.25=0.15$.

**Question 2 (regression & correlation):** Using $\text{Cov}(X,Y)=0.15$ and $\text{Var}(X)=E[X^2]-E[X]^2=0.5-0.25=0.25$, find the least-squares slope $b$ for predicting $Y$ from $X$, and the intercept $a$.

*Answer:* $b=\dfrac{\text{Cov}(X,Y)}{\text{Var}(X)}=\dfrac{0.15}{0.25}=0.6$. $a=E[Y]-bE[X]=0.5-0.6(0.5)=0.2$. Regression line: $\hat{y}=0.2+0.6x$ — check: at $x=1$, $\hat{y}=0.8$, close to the true conditional mean $E[Y\mid X=1]=p(1,1)/P(X=1)=0.4/0.5=0.8$ exactly, as expected for a joint that is itself linear in this simple binary case.

**Why this drill exists:** students learn $\text{Cov}(X,Y)$ and the regression slope $b$ as formulas from two different chapters and rarely see that $b$ is *literally* $\text{Cov}(X,Y)/\text{Var}(X)$ — the same covariance, rescaled by the predictor's own spread. Computing both from one joint distribution makes that dependency impossible to miss.
