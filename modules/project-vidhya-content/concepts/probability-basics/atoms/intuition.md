---
id: probability-basics.intuition
concept_id: probability-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

Picture the full space of outcomes as a rectangle — everything that could happen. An event $A$ is a region inside it; $P(A)$ is the fraction of the rectangle that region covers.

Conditional probability shrinks the rectangle. $P(A\mid B)$ asks: once you know event $B$ happened, restrict your attention to only the $B$-region, and ask what fraction of *that* smaller region is also $A$. The formula
$$P(A\mid B) = \frac{P(A\cap B)}{P(B)}$$
is exactly that shrink-and-refocus: the overlap, rescaled to the new, smaller universe.

Bayes' theorem runs that shrink in reverse. You're often given $P(B\mid A)$ — how likely the evidence is *given* the cause — but you want $P(A\mid B)$: how likely the cause is *given* the evidence you actually observed. Bayes' theorem is the bookkeeping that lets you flip the condition without silently swapping the two probabilities, which is exactly the mistake behind the rare-disease/positive-test paradox: a highly accurate test can still mostly produce false alarms when the condition itself is rare.
