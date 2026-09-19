---
id: sets-relations-functions.hook-shaken
concept_id: sets-relations-functions
atom_type: hook
variant_of: sets-relations-functions.hook
for_stance: shaken
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Type PNR $8421067339$ into a railway status checker. It must return exactly one status — say, Confirmed. Not Confirmed *and* Waiting at once. One input, one output.

Two different PNRs, $8421067339$ and $9910442218$, could both come back Confirmed — that is allowed. What is never allowed is the *same* PNR returning two different statuses on two checks. That single rule is the whole definition of a **function**: one input, one output, no exceptions.

A **relation** is looser — any pairing at all between two sets, with no such rule enforced. A function is a relation that additionally keeps that one promise.
