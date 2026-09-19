---
id: sequences-series.intuition
concept_id: sequences-series
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
---

**Three progressions, three growth patterns.** An arithmetic progression (AP) adds the same amount every step: $2,5,8,11,\dots$ (add $3$ each time). A geometric progression (GP) multiplies by the same amount every step: $2,6,18,54,\dots$ (multiply by $3$ each time) — GPs grow (or shrink) much faster than APs once the common ratio moves away from $1$. A harmonic progression (HP) is simply an AP viewed upside down: a sequence is an HP exactly when the RECIPROCALS of its terms form an AP.

**Why three different means exist.** Given two positive numbers, their arithmetic mean (AM) is the middle of an AP through them; their geometric mean (GM) is the middle of a GP through them; their harmonic mean (HM) is the middle of an HP through them. These three means are never interchangeable — mixing them up (as in the speed example above) gives a wrong number, not an approximately-right one.

**The AM $\geq$ GM $\geq$ HM chain.** For any positive numbers, AM is always the largest of the three, HM is always the smallest, with GM sandwiched in between — and all three become equal only when every number in the set is identical. This single inequality is the engine behind most JEE optimisation questions phrased as "given a fixed sum, find the maximum product" or similar.

**Telescoping.** Some sums are designed to collapse: if each term can be rewritten as (something) $-$ (the next something), then adding a long run of them leaves only the very first and very last pieces standing — everything in between cancels in pairs.
