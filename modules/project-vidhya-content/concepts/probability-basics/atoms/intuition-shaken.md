---
# Alternative body for probability-basics.intuition, served when the
# learner stance is `shaken`. See src/content/stance-variants.ts.
id: probability-basics.intuition.shaken
concept_id: probability-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: probability-basics.intuition
for_stance: shaken
---

Draw a box. That's every possible outcome.

Shade region $A$ inside it. $P(A)$ is how much of the box is shaded.

Now shrink the box down to just region $B$ — throw away everything outside $B$.

Inside that smaller box, how much is still shaded by $A$? That fraction is $P(A\mid B)$.

$$P(A\mid B) = \frac{P(A\cap B)}{P(B)}$$

Bayes' theorem runs this the other direction: start knowing the $B$-given-$A$ fraction, end up finding the $A$-given-$B$ fraction.

$$P(A\mid B) = \frac{P(B\mid A)\,P(A)}{P(B)}$$

Same box, same shrink — just solved for the opposite condition.
