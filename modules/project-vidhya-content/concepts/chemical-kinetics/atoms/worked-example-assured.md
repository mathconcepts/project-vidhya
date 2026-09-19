---
id: chemical-kinetics.worked-example-assured
concept_id: chemical-kinetics
atom_type: worked_example
variant_of: chemical-kinetics.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
scaffold_fade: true
---

Assuming first-order kinetics let the half-life be reused unchanged across all three halvings above — check that this assumption was actually safe before trusting the shortcut.

If the reaction were zero order instead, $t_{1/2}=\dfrac{[A]_0}{2k}$ would keep SHRINKING at each successive halving, since it depends directly on the concentration still present — starting from $80\ \text{mg/L}$ would give one $t_{1/2}$, but starting from $40\ \text{mg/L}$ (already halved once) would give exactly half of that. A genuinely constant half-life across all three halvings, as observed here, is itself the confirmation that the reaction is first order — not an assumption made for convenience.

**A constant half-life, independent of how much reactant remains, is the diagnostic test for first order — nowhere near a coincidence.** Reaching for the halving-count shortcut without first checking that the half-life is genuinely fixed would silently misapply a first-order result to a zero-order (or any other-order) reaction.
