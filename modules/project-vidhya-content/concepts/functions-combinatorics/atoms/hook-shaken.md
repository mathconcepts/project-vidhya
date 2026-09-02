---
# Alternative body for functions-combinatorics.hook, stance `shaken`.
id: functions-combinatorics.hook.shaken
concept_id: functions-combinatorics
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: functions-combinatorics.hook
for_stance: shaken
---

Four letters, two mailboxes. No mailbox may stay empty.

Total ways, ignoring that rule: each letter picks $1$ of $2$ boxes, so $2\times2\times2\times2=16$.

Now remove the arrangements where one mailbox gets nothing: that happens in exactly $2$ ways — all four letters in box A, or all four in box B.

$16-2=14$ valid arrangements. That subtraction step is the one to get right.
