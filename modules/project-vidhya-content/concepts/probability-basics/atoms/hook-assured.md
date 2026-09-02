---
# Alternative body for probability-basics.hook, served when the learner
# stance is `assured`. See src/content/stance-variants.ts.
id: probability-basics.hook.assured
concept_id: probability-basics
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: probability-basics.hook
for_stance: assured
---

You already compute probabilities fluently. The one habit worth checking: when new information arrives, you're computing $P(A\mid B)$, not silently assuming it equals $P(B\mid A)$. They're equal only when $P(A)=P(B)$ — otherwise Bayes' theorem is doing real work, not busywork. A test with 99% sensitivity does not mean a positive result is 99% likely to indicate disease; that number is the likelihood, not the posterior, and the two diverge hardest exactly when the disease is rare.
