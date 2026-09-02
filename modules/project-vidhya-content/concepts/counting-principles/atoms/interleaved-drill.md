---
id: counting-principles.interleaved-drill
concept_id: counting-principles
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: counting-principles → probability-basics.**

A team of 4 is chosen at random from 5 women and 4 men (9 people, $C(9,4)=126$ equally likely teams).

**Question 1 (counting-principles):** How many of these teams have exactly 2 women?

*Answer:* $C(5,2)\cdot C(4,2) = 10\times6 = 60$.

**Question 2 (probability-basics):** What is the probability that a randomly chosen team has exactly 2 women?

*Answer:* $\dfrac{60}{126} = \dfrac{10}{21} \approx 0.476$ — the count from Question 1 becomes a probability only once it's divided by the *total* equally-likely outcome count, not by any other number.

**Why this drill exists:** students often carry a correct count into a probability answer without dividing by the right denominator — either the total sample space, or worse, a partial count from an earlier step. Confirming both numbers by hand (60 and 126) before dividing catches that slip before it reaches the final fraction.
