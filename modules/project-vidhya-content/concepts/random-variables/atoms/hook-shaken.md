---
# Alternative body for random-variables.hook, served when the learner
# stance is `shaken`. See src/content/stance-variants.ts.
id: random-variables.hook.shaken
concept_id: random-variables
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: random-variables.hook
for_stance: shaken
---

A machine gives 1, 2, or 3 snacks with probabilities 0.2, 0.3, 0.5.

Check first: $0.2+0.3+0.5=1$. Good — this is a valid PMF.

$$E[X] = 1(0.2)+2(0.3)+3(0.5) = 0.2+0.6+1.5=2.3$$

That single sum is the average snack count per press. Everything in this topic builds from a sum shaped exactly like this one.
