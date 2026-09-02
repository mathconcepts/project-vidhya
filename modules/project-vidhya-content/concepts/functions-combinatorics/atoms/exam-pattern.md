---
id: functions-combinatorics.exam-pattern
concept_id: functions-combinatorics
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT "count the arrangements/selections" questions** hinge entirely on spotting whether order matters. A phrase like "form a committee" signals $\binom{n}{k}$; "arrange in a line," "assign distinct positions," or "rank" signals $P(n,k)$.

  Example: choosing $3$ students from $8$ for an unranked team is $\binom{8}{3}=56$; choosing $3$ students from $8$ for president/secretary/treasurer is $P(8,3)=336$ — a $6\times$ difference from the same "choose $3$ of $8$" starting point, purely from whether roles are assigned.

- **MCQ "injective/surjective/bijective" questions** often give a small finite function as an explicit table and ask which properties hold — check the two conditions (distinct outputs; every codomain element hit) directly rather than reasoning abstractly.

- **MSQ questions on the inclusion-exclusion onto-count** test whether students can generalize past $2$ codomain elements; a $3$-box or $4$-box onto count is a common trap for the "subtract the trivial cases" shortcut.

- **Time budget:** a direct $P(n,k)$/$\binom{n}{k}$ NAT question should take under $60$ seconds; an onto-counting question with inclusion-exclusion should budget closer to $2$ minutes for $3$ terms.
