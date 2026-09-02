---
id: functions-combinatorics.hook
concept_id: functions-combinatorics
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Four distinct letters, two mailboxes. Every arrangement is allowed except one: no mailbox may stay empty. How many valid arrangements are there?

Total arrangements ignoring the "no empty mailbox" rule: each letter independently picks one of $2$ boxes, so $2^4=16$. The rule removes exactly the arrangements where every letter piled into the same box — but counting "at least one letter in each box" directly, rather than just subtracting the two obvious all-in-one-box cases, is where a first attempt usually goes wrong once there are more than two boxes.
