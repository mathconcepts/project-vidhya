---
# Alternative body for propositional-logic.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: propositional-logic.hook.shaken
concept_id: propositional-logic
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: propositional-logic.hook
for_stance: shaken
---

Let $p$ be true and $q$ be false. Evaluate $p\to q$ by the rule "false only when the front is true and the back is false": here the front is true and the back is false, so $p\to q$ is false. Now swap: $p$ false, $q$ true — check $p\to q$ again by the same rule. It comes out true. One case flipped the value; the question is which single case, out of four, makes an implication false at all.
