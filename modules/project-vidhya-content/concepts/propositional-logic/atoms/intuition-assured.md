---
# Alternative body for propositional-logic.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: propositional-logic.intuition.assured
concept_id: propositional-logic
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: propositional-logic.intuition
for_stance: assured
---

Equivalence ($\leftrightarrow$) and implication ($\to$) are not the same relation: $p\to q\equiv\neg p\lor q$ is true on three of four rows, $p\leftrightarrow q$ only on the two rows where $p,q$ match. Treating "implies" as "means the same as" silently converts a contingent formula into a tautology on paper.

Converse and contrapositive split the same way: $q\to p$ has its own independent truth table, while $\neg q\to\neg p$ is logically identical to $p\to q$ row for row — proving one proves the other, but proving the converse proves nothing extra about the original.

A tautology needs every row true, so a single false row anywhere disqualifies it — a claimed tautology only needs one counter-row to be refuted. A claimed contradiction needs every row checked false instead, which is the harder direction a rushed answer tends to skip.
