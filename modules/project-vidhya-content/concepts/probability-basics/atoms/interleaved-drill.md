---
id: probability-basics.interleaved-drill
concept_id: probability-basics
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: probability-basics → random-variables.**

From the disease-test story: $P(D)=0.01$, and a positive test occurs with probability $P(\text{pos})=0.0594$.

**Question 1 (probability-basics):** Define $X=1$ if a random person has the disease, $X=0$ otherwise. What is $P(X=1)$?

*Answer:* $P(X=1)=P(D)=0.01$ directly — the indicator's probability of being 1 *is* the event's probability, nothing more to compute.

**Question 2 (random-variables):** $X$ is a Bernoulli random variable. What are $E[X]$ and $\text{Var}(X)$?

*Answer:* For Bernoulli with parameter $p=0.01$: $E[X]=p=0.01$, and $\text{Var}(X)=p(1-p)=0.01\times0.99=0.0099$.

**Why this drill exists:** students often treat "expectation" as needing a new formula for every named distribution, missing that a Bernoulli's mean and variance are just $P(X=1)$ and $P(X=1)P(X=0)$ read off directly — the probability-axioms machinery from this concept *is* the random-variable machinery, just renamed.
