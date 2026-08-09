---
id: probability-basics.common-traps
concept_id: probability-basics
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing "or" with addition rule for non-mutually-exclusive events**: Students often write $P(A \cup B) = P(A) + P(B)$ even when $A$ and $B$ overlap. The correct formula is $P(A \cup B) = P(A) + P(B) - P(A \cap B)$. Red flag: if the student adds two probabilities and gets > 1, they have overlap!
- **Forgetting to use the complement for "at least one" problems**: Many students try to enumerate all cases for "at least one success in $n$ trials," which is tedious. The complement rule $P(A) = 1 - P(A^c)$ is faster: find the probability of zero successes, then subtract from 1.
- **Treating dependent events as independent**: When drawing cards without replacement from a deck, each draw changes the sample space. Students write $P(A \text{ then } B) = P(A) \times P(B)$ when they should use conditional probability, $P(A \text{ then } B) = P(A) \times P(B|A)$.
