---
# Alternative body for probability-basics.intuition, served when the
# learner stance is `assured`. See src/content/stance-variants.ts.
id: probability-basics.intuition.assured
concept_id: probability-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: probability-basics.intuition
for_stance: assured
---

The rectangle picture generalises past "shrink and rescale" the moment two events interact. Independence means $P(A\mid B) = P(A)$ — knowing $B$ tells you nothing about $A$, so $P(A\cap B)=P(A)P(B)$. Mutual exclusivity means the opposite kind of relationship entirely: $A$ and $B$ can't both happen, so $P(A\cap B)=0$. Students conflate the two because both sound like "unrelated," but two mutually exclusive events with nonzero probability are the *most* dependent pair possible — knowing one occurred makes the other's probability collapse to exactly zero. Never assume independence from "the events seem unrelated"; check the defining equation.
