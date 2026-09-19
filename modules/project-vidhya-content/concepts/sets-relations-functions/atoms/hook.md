---
id: sets-relations-functions.hook
concept_id: sets-relations-functions
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Type a PNR number into a railway status checker and it must return exactly one status: Confirmed, RAC, or Waiting. Never two statuses for the same PNR — that would mean the system is broken, not clever. This "one input, one output" rule is what makes something a **function**, not just any pairing.

Many different PNRs can share the same status — that is completely fine, functions allow it. Two different statuses for the *same* PNR is what a function forbids. A **relation** is any pairing at all between two sets, with no such rule. A function is a relation that additionally promises: every input gets exactly one output, no exceptions.
