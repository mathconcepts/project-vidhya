---
# Alternative body for propositional-logic.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: propositional-logic.intuition.shaken
concept_id: propositional-logic
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: propositional-logic.intuition
for_stance: shaken
---

Let $p$ be true, $q$ be false. Work out each connective on that single row: $\neg p$ is false; $p\land q$ needs both true, so it's false; $p\lor q$ needs at least one true, so it's true; $p\to q$ is false only here, true front and false back, so it's false. Now flip $q$ to true, same $p$: $\neg p$ stays false; $p\land q$ becomes true; $p\lor q$ stays true; $p\to q$ becomes true. Two rows worked by hand, four connectives each — that's most of the table for two variables, with two rows left to add.

A formula is a tautology if every row lands on true, and a contradiction if every row lands on false; anything else is contingent. Check $p\to q$ against $\neg p\lor q$ on the first row above: the front-true-back-false row gave $p\to q=\text{false}$, and $\neg p\lor q=\text{false}\lor\text{false}=\text{false}$ — matched. On the second row, both came out true. Matching on every row is what "equivalent" means — not similar, identical across all four rows.

De Morgan's flips AND to OR under a negation, and it holds row for row the same way: $\neg(p\land q)$ and $\neg p\lor\neg q$ agree on both rows checked above too.
