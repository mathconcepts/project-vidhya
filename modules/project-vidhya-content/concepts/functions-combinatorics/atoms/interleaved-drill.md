---
id: functions-combinatorics.interleaved-drill
concept_id: functions-combinatorics
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: combinatorics → recurrence relations.**

Pascal's identity, $\binom{n}{k}=\binom{n-1}{k-1}+\binom{n-1}{k}$, is itself a recurrence relation on two indices.

**Question 1 (combinatorics):** Explain why $\binom{n-1}{k-1}+\binom{n-1}{k}$ counts the same thing as $\binom{n}{k}$.

*Answer:* Fix one element $x$ of the $n$-set. Every $k$-subset either contains $x$ (choose the remaining $k-1$ from the other $n-1$: $\binom{n-1}{k-1}$ ways) or excludes $x$ (choose all $k$ from the other $n-1$: $\binom{n-1}{k}$ ways) — a complete, non-overlapping split.

**Question 2 (recurrence relations):** Treat $\binom{5}{k}$ for fixed $n=5$ as a sequence in $k$. Verify $\binom{5}{2}=\binom{4}{1}+\binom{4}{2}$ numerically.

*Answer:* $\binom{4}{1}=4$, $\binom{4}{2}=6$, sum $=10=\binom{5}{2}$ ✓.

**Why this drill exists:** Pascal's triangle is usually memorized as a shape, not recognized as a two-index recurrence — seeing it that way transfers directly to solving other combinatorial recurrences by conditioning on one element's fate.
