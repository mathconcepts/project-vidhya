---
id: capacitance.intuition-assured
concept_id: capacitance
atom_type: intuition
variant_of: capacitance.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Series-versus-parallel combination is settled business by now. What genuinely trips people up: "inserting a dielectric ($K$ times the capacitance) always increases the stored energy" is **false** — the outcome depends entirely on whether the battery stays connected while the dielectric goes in.

**Battery stays connected** (voltage $V$ fixed): capacitance becomes $C'=KC$, so charge $Q'=KQ$ increases, and stored energy $U'=\tfrac12 C'V^2=KU$ also increases — the battery supplies the extra charge.

**Battery is disconnected first** (charge $Q$ fixed, isolated): capacitance still becomes $C'=KC$, but now $Q$ cannot change, so voltage *drops* to $V'=V/K$, and stored energy becomes $U'=\dfrac{Q^2}{2C'}=U/K$ — energy **decreases**, not increases, because no external source is topping it up anymore.

Same dielectric, same capacitor, opposite effect on stored energy — entirely because of one detail: was the battery connected at the moment the dielectric went in.

