---
id: gravitation.interleaved-drill
concept_id: gravitation
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
tested_by_atom: gravitation.micro-exercise
---

**Cross-concept check: gravitation → work-energy-power.**

**Question 1 (energy-conservation route):** Derive escape velocity $v_e$ from Earth's surface by setting total mechanical energy at launch equal to total mechanical energy at $r=\infty$ (where both $KE$ and $U$ are zero, for the minimum-energy case).

*Answer:* $\tfrac12mv_e^2 + \left(-\dfrac{GMm}{R}\right) = 0 + 0 \Rightarrow \tfrac12mv_e^2 = \dfrac{GMm}{R} \Rightarrow v_e = \sqrt{\dfrac{2GM}{R}}$.

**Question 2 (work-energy-theorem route, same setup):** Now derive the same result starting from $W_{net}=\Delta KE$ instead, using the work done by gravity as the object travels from the surface to infinity.

*Answer:* Work done by gravity equals the drop in potential energy: $W_{gravity} = -(U_\infty - U_R) = -\left(0-\left(-\dfrac{GMm}{R}\right)\right) = -\dfrac{GMm}{R}$ (negative, since gravity pulls backward on an object moving away). By the work-energy theorem, $W_{net}=\Delta KE = KE_\infty - KE_i = 0 - \tfrac12mv_e^2$. Setting them equal: $-\dfrac{GMm}{R} = -\tfrac12mv_e^2 \Rightarrow v_e=\sqrt{\dfrac{2GM}{R}}$ — the identical formula.

**Why this drill exists:** conservation of mechanical energy and the work-energy theorem are never two competing tools for a gravitation problem — the first is just the second, applied to a situation where gravity is the only force doing work. Escape velocity is a genuine work-energy-theorem result wearing a gravitation costume.

