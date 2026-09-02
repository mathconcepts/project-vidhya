---
# Alternative body for functions-combinatorics.hook, stance `assured`.
id: functions-combinatorics.hook.assured
concept_id: functions-combinatorics
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: functions-combinatorics.hook
for_stance: assured
---

The "no empty box" count is a surjection count, and inclusion-exclusion gives it directly: $2^4 - \binom{2}{1}1^4 = 16-2=14$.

The tempting shortcut — "just subtract the two all-in-one-box cases from $16$" — happens to land on the right answer only because there are $k=2$ boxes. For $3$ or more boxes, subtracting only the all-in-one-box cases overcounts what's removed: cases with exactly two boxes empty (out of three or more) get double-subtracted or skipped depending on how the shortcut is patched, which is exactly why the full alternating inclusion-exclusion sum exists.
