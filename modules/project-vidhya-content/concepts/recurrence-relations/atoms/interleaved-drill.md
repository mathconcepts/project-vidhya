---
id: recurrence-relations.interleaved-drill
concept_id: recurrence-relations
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.65
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: recurrence relations → combinatorics.**

$\binom{n}{k}=\binom{n-1}{k-1}+\binom{n-1}{k}$ is a two-index recurrence hiding inside a familiar counting formula.

**Question 1 (recurrence relations):** Treat row $n=5$ of Pascal's triangle as a sequence indexed by $k=0,\dots,5$. What recurrence connects it to row $n=4$?

*Answer:* Each entry is the sum of the two entries above it: $\binom{5}{k}=\binom{4}{k-1}+\binom{4}{k}$ — a recurrence across rows, not within one row.

**Question 2 (combinatorics):** Verify $\binom{5}{2}=\binom{4}{1}+\binom{4}{2}$ by direct computation.

*Answer:* $\binom{4}{1}=4,\ \binom{4}{2}=6$, sum $=10=\binom{5}{2}$ ✓.

**Why this drill exists:** students solving recurrences with characteristic equations often don't recognize combinatorial identities as recurrences in disguise — Pascal's rule is linear, just indexed by two variables instead of one, and the same "small case, verify by direct substitution" instinct applies to both.
