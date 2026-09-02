---
# Alternative body for propositional-logic.hook, served when the learner
# stance is `assured`. See src/content/stance-variants.ts for selection.
#
# Terse, assumes the vocabulary, spends its words on the one distinction
# that costs marks rather than re-teaching the mechanics.
id: propositional-logic.hook.assured
concept_id: propositional-logic
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: propositional-logic.hook
for_stance: assured
---

You know $P\to Q$ is false only when $P$ is true and $Q$ is false. The distinction worth a mark: $P\to Q$ is a claim about truth values, not causation — a vacuously true implication ($P$ false) carries zero information about $Q$, so "assume the antecedent held anyway" is the error that turns a valid inference into an invalid one.

Watch for it in indirect proofs: proving $\neg Q \to \neg P$ is a legitimate route to $P\to Q$ (the contrapositive), but assuming $\neg P \to \neg Q$ (the inverse) proves nothing about the original — the inverse is not equivalent to it.
