---
id: discrete-distributions.interleaved-drill
concept_id: discrete-distributions
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: discrete-distributions → continuous-distributions.**

Calls arrive at a call center at rate $\lambda=2$ per minute (Poisson process).

**Question 1 (discrete-distributions):** What is $P(\text{0 calls in the next minute})$?

*Answer:* $P(X=0)=e^{-2}\approx0.1353$, from the Poisson PMF with $\lambda=2$.

**Question 2 (continuous-distributions):** What is the probability that the *waiting time* until the next call exceeds 1 minute?

*Answer:* The waiting time $T$ between Poisson events is Exponential with rate $\lambda=2$: $P(T>1)=e^{-\lambda\cdot1}=e^{-2}\approx0.1353$ — the same number, because "0 events by time 1" and "the first event happens after time 1" are the same statement about the same process, just counted two different ways.

**Why this drill exists:** students treat Poisson (a discrete count) and Exponential (a continuous waiting time) as unrelated topics on the syllabus, missing that they describe the *same* underlying rare-event process from two different angles — the algebra of one directly checks the other.
