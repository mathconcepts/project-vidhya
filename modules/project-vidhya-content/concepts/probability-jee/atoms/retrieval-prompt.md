---
id: probability-jee.retrieval-prompt
concept_id: probability-jee
atom_type: retrieval_prompt
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
---

**Recall**: State Bayes' theorem for finding $P(E_1|A)$ when $E_1,\dots,E_n$ partition the sample space, and explain in one sentence why the denominator can never be just $P(A|E_1)$.

<!-- answer -->

**Answer**: $P(E_1|A)=\dfrac{P(E_1)\,P(A|E_1)}{\sum_{j=1}^n P(E_j)\,P(A|E_j)}$. The denominator must be the TOTAL probability of $A$ across every way $A$ could happen — through $E_1$, or $E_2$, or any other $E_j$ — because if it were only $P(A|E_1)$, the resulting fractions across all $i$ would not add up to $1$, and the result would no longer be a valid probability at all.
