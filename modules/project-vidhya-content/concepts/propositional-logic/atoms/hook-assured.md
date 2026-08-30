---
# Alternative body for propositional-logic.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: propositional-logic.hook.assured
concept_id: propositional-logic
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: propositional-logic.hook
for_stance: assured
---

Implication and equivalence read as interchangeable under exam pressure and are not: $p\to q$ is true on three of the four rows and false only when $p$ is true and $q$ is false, while $p\leftrightarrow q$ is true only on the two rows where $p$ and $q$ match. Treating "$p$ implies $q$" as "$p$ and $q$ mean the same thing" turns a contingent formula into a tautology on the page. The converse $q\to p$ and the contrapositive $\neg q\to\neg p$ split the same way — the contrapositive shares $p\to q$'s truth table exactly, the converse generally does not.
