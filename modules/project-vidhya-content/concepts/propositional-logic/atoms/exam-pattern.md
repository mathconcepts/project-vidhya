---
id: propositional-logic.exam-pattern
concept_id: propositional-logic
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **MCQ "identify the equivalent statement" questions** give one compound proposition and four candidate rewrites; exactly one matches on every row. Building the full truth table for the original and testing each candidate against it beats trying to spot the right algebraic law from memory.

  Example: given $\neg(P\to Q)$, the equivalent form is $P\land\neg Q$ — verified: $\neg(P\to Q)$ is true only at $P{=}T,Q{=}F$, and $P\land\neg Q$ is true at exactly that same row.

- **MSQ "which of the following are tautologies" questions** test several formulas at once; each still reduces to its own $2^n$-row table, so budget time per formula rather than trying to eyeball all of them together.

- **NAT questions** sometimes ask for the number of rows, out of $2^n$, where a compound proposition is true — a direct row-count, not a proof.

- **A recurring distractor:** an option built from the *inverse* or *converse* of a stated implication, offered as if it were equivalent. Checking contrapositive-only-equivalence catches this in one line.

- **Time budget:** a 2-variable truth-table question should take under a minute; a 3-variable one under two, since the table itself is only $8$ rows.
