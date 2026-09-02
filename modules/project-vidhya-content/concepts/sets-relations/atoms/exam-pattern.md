---
id: sets-relations.exam-pattern
concept_id: sets-relations
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ "which property fails" questions** give a concrete relation as a set of ordered pairs or a rule, and ask which of reflexive/symmetric/transitive/antisymmetric it lacks. Test each axiom against the smallest case that could break it — a self-pair for reflexivity, a single reversed pair for symmetry — rather than scanning the whole relation for each property separately.

- **MSQ "poset properties" questions** combine relation-type identification with Hasse-diagram reading: is the relation a partial order, and if so, is it a total order (every pair comparable)?

  Example: divisibility on $\{1,2,3,6\}$ is a partial order but not total — $2$ and $3$ are incomparable ($2\nmid3$ and $3\nmid2$).

- **NAT questions** ask for the number of equivalence classes a given relation induces on a finite set, or the size of a specific class — read directly from the partition, no listing required once the defining rule (like "same remainder mod $k$") is recognized.

- **Time budget:** verifying all three (or four) axioms on a relation given as an explicit pair-list should take under $90$ seconds for a set of size $\le6$; longer usually means re-checking pairs already confirmed.
