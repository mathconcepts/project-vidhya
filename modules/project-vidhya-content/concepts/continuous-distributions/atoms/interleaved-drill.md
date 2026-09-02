---
id: continuous-distributions.interleaved-drill
concept_id: continuous-distributions
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: continuous-distributions → random-variables.**

$X\sim\text{Exponential}(\lambda=0.5)$.

**Question 1 (continuous-distributions):** What is $E[X]$ and $\text{Var}(X)$?

*Answer:* For Exponential, $E[X]=1/\lambda=2$ and $\text{Var}(X)=1/\lambda^2=4$ — both closed-form, no integration needed once the distribution is identified.

**Question 2 (random-variables):** Confirm $\text{Var}(X)=E[X^2]-(E[X])^2$ is consistent with these values, without re-deriving $E[X^2]$ from the integral.

*Answer:* Rearranged, $E[X^2]=\text{Var}(X)+(E[X])^2=4+4=8$ — the general variance identity from random-variables holds for *any* distribution, discrete or continuous; only the method of computing $E[X]$ and $E[X^2]$ (sum vs. integral) changes between the two.

**Why this drill exists:** students sometimes treat "continuous distributions" as needing an entirely separate toolkit for expectation and variance — this drill confirms the same $E[X^2]-(E[X])^2$ identity from random-variables applies unchanged, just fed by a different computation underneath.
