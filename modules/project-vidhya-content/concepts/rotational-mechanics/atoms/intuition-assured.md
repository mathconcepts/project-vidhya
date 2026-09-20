---
id: rotational-mechanics.intuition-assured
concept_id: rotational-mechanics
atom_type: intuition
variant_of: rotational-mechanics.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

$\tau=I\alpha$ and $I=I_{cm}+Md^2$ need no fresh introduction by now. The sharper distinction worth nailing down: the parallel axis theorem needs $I_{cm}$ about an axis through the centre of mass **and parallel** to the target axis — apply it with a non-central or non-parallel axis and the formula is simply wrong, not just imprecise.

Counterexample: a uniform rod of length $L$, mass $M$, has $I_{cm}=\tfrac{1}{12}ML^2$ about its centre. Its moment of inertia about one *end* is $I_{end}=I_{cm}+M(L/2)^2 = \tfrac{1}{12}ML^2+\tfrac14 ML^2=\tfrac13 ML^2$ — correct, because the end-axis is parallel to the centre-axis. But a student who reaches for $I=I_{cm}+Md^2$ to shift between two axes that are **not** parallel (say, one along the rod and one perpendicular to it through the same point) gets a meaningless number — the theorem simply does not apply there, and no algebra can rescue it. Confirm parallel axes before reaching for this formula at all, not after.

