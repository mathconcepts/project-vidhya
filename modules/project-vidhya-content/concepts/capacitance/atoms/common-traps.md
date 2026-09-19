---
id: capacitance.common-traps
concept_id: capacitance
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Applying the resistor rule to capacitors.** Resistors add directly in series and combine as a product-over-sum in parallel. Capacitors do the *opposite*: $1/C_s=1/C_1+1/C_2$ in series (always smaller than either one), and $C_p=C_1+C_2$ in parallel (always larger than either one). Carrying the resistor pattern over to a capacitor question flips both answers.

- **Averaging voltages instead of conserving charge, on redistribution problems.** When two pre-charged capacitors are connected, the common final voltage is $V=Q_{\text{total}}/(C_1+C_2)$, found from charge conservation — it is *not* the simple average $(V_1+V_2)/2$ of the two starting voltages, except in the special case where $C_1=C_2$.

- **Forgetting the sign when plates are joined unlike-to-unlike.** If a positive plate is joined to a *negative* plate instead of another positive plate, the charges partly cancel: $Q_{\text{total}}=|Q_1-Q_2|$, not $Q_1+Q_2$. Reading which plates are actually connected in the circuit diagram decides which formula applies.

- **Assuming a dielectric always increases stored energy.** True only if the battery stays connected while it's inserted (voltage fixed, energy increases). If the capacitor is isolated first (charge fixed), inserting the same dielectric *decreases* the stored energy instead, since the voltage across the capacitor drops.

