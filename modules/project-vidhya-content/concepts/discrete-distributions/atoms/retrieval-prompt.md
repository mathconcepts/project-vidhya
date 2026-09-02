---
id: discrete-distributions.retrieval-prompt
concept_id: discrete-distributions
atom_type: retrieval_prompt
bloom_level: 1
difficulty: 0.3
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["binomial-vs-hypergeometric", "poisson-limit"]
---

From memory: what single feature of the sampling process tells you to use Hypergeometric instead of Binomial?

<details>
<summary>Answer</summary>

Sampling *without replacement* from a *finite* population — each draw changes the success probability for the next, which Binomial's constant-$p$ assumption can't capture.
</details>
