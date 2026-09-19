---
id: capacitance.intuition
concept_id: capacitance
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Picture a capacitor as a small tank that can hold charge — two parallel metal plates, separated by a gap, one plate pumped full of positive charge and the other left with an equal negative charge. **Capacitance** $C=Q/V$ is how much charge the tank holds per volt of "pressure" (voltage) pushing it in — a bigger tank (larger plates, or a smaller gap) holds more charge for the same voltage.

Now the part that trips up almost everyone: combining capacitors works the **opposite** way to combining resistors.

- **Resistors in series add directly** ($R_{\text{series}}=R_1+R_2$), because the *same current* has to fight through both, one after another.
- **Capacitors in series do the opposite** ($1/C_{\text{series}}=1/C_1+1/C_2$, always smaller than the smallest individual capacitor) — because in series, it's the *same charge* $Q$ that sits on every capacitor, and the voltages (which now add up) are what determine the combined behaviour.
- **Capacitors in parallel add directly** ($C_{\text{parallel}}=C_1+C_2$), because in parallel it's the *same voltage* across every capacitor, and their charges (which now add up) combine into one bigger tank.

Series capacitors behave like parallel resistors, and parallel capacitors behave like series resistors — memorising "series adds" as a blanket rule for every component is exactly the trap this concept is built to test.

