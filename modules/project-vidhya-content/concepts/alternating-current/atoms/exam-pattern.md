---
id: alternating-current.exam-pattern
concept_id: alternating-current
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
modality: text
---

**How JEE Main actually asks this.**

- **NAT: resonant frequency or resonant $\omega$ from $L$ and $C$.** Given $L$ and $C$ directly, compute $\omega_0 = 1/\sqrt{LC}$ in one line — no need to find $X_L$ or $X_C$ separately unless the question also asks for the impedance at resonance.

- **MCQ: rms-vs-peak identification.** The moment a question states "the voltage is $V(t) = V_0\sin(\omega t)$" and then asks for power, heating effect, or a wattmeter/ammeter reading, switch to rms values immediately — those instruments read rms, never peak.

- **Trap: "phase angle" questions that only want the sign.** When a question asks whether current leads or lags, compare $X_L$ and $X_C$ first: $X_L>X_C$ means lagging, $X_C>X_L$ means leading. Computing the exact angle $\phi$ before deciding the sign wastes time the question did not ask for.

- **Trap: transformer efficiency assumed to be $100\%$ by default.** A transformer question that gives an efficiency below $100\%$ expects $\text{output power} = \eta \times \text{input power}$, not $V_pI_p=V_sI_s$ used unchanged — reusing the ideal formula when a real efficiency is stated silently drops the loss.

- **Time budget:** a direct $\omega_0$, $X_L$, or $X_C$ NAT should take under $30$ seconds. A full LCR impedance-and-power MCQ, worked the way this concept's example was, should take under $90$ seconds.
