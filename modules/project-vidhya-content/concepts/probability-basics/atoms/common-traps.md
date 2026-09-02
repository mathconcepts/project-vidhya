---
id: probability-basics.common-traps
concept_id: probability-basics
atom_type: common_traps
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
---

**Trap 1 — The prosecutor's fallacy.** Treating $P(\text{pos}\mid D)$ (test accuracy) as if it were $P(D\mid\text{pos})$ (what you actually want). They're equal only in special cases, and confusing them is the single most common Bayes' theorem error.

**Trap 2 — Forgetting the base rate.** A 99%-accurate test on a rare condition can still produce mostly false positives. Skipping $P(D)$ in the calculation silently assumes the condition is common.

**Trap 3 — Independence assumed from "unrelated-sounding" events.** $P(A\cap B)=P(A)P(B)$ only holds when independence is actually established — never assume it from wording alone.

**Trap 4 — Double-counting the overlap.** $P(A\cup B)=P(A)+P(B)-P(A\cap B)$ for events that *can* both happen; dropping the $-P(A\cap B)$ term overcounts the intersection.
