---
id: probability-basics.formal-definition
concept_id: probability-basics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Probability of an Event**: The ratio of favorable outcomes to total equally-likely outcomes in a sample space.
$$P(A) = \frac{\text{Number of favorable outcomes}}{\text{Total number of possible outcomes}} = \frac{|A|}{|S|}$$

**Sample Space ($S$)**: The set of all possible outcomes of a random experiment.

**Event ($A$)**: A subset of the sample space — one or more outcomes of interest.

**Classical Probability Axioms**:
1. $0 \le P(A) \le 1$ for any event $A$ (probability is bounded).
2. $P(S) = 1$ (the entire sample space has probability 1).
3. For mutually exclusive events $A$ and $B$: $P(A \cup B) = P(A) + P(B)$ (addition rule).
4. $P(A^c) = 1 - P(A)$ (complement rule).

Geometric interpretation: probability is the proportion of favorable outcomes in the sample space. If the sample space has 100 equally likely elements and event $A$ contains 30 of them, then $P(A) = 0.3$ — imagine a dartboard where 30% of the area is shaded as favorable.
