---
id: gravitation.intuition-assured
concept_id: gravitation
atom_type: intuition
variant_of: gravitation.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

$U=-GMm/r$ and $v=\sqrt{GM/r}$ need no restating at this point. Where marks genuinely slip away: near-surface $U=mgh$ is **not** a sign-flipped version of the same formula with a different zero point — it is a first-order approximation, valid only for $h\ll R$, and using it for a satellite hundreds of kilometres up gives a genuinely wrong number, not just an inconvenient one.

Counterexample: at height $h=R$ (so $r=2R$), the true potential-energy change from the surface is $\Delta U = -GMm/r - (-GMm/R) = GMm/R - GMm/(2R) = GMm/(2R)$. The near-surface approximation would instead say $\Delta U \approx mgh = mgR$ — comparing $GMm/(2R)$ with $mgR$ using $GM=gR^2$ gives $gR/2$ against $gR$, a factor of **two** apart, not a small correction. $mgh$ silently assumes $g$ stays constant over the climb; here it has already dropped to a quarter of its surface value, and the approximation fails by exactly the amount that assumption costs.

