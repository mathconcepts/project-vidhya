---
id: capacitance.worked-example-assured
concept_id: capacitance
atom_type: worked_example
variant_of: capacitance.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** $C_1=2\ \mu\text{F}$ at $V_1=6\ \text{V}$ and $C_2=4\ \mu\text{F}$ at $V_2=12\ \text{V}$, both isolated, joined positive-to-positive. Find the final voltage and the energy lost.

---

**Step 1 — Charge conservation, joined like-to-like.** $Q_1=12\ \mu\text{C}$, $Q_2=48\ \mu\text{C}$, so $Q_{\text{total}}=60\ \mu\text{C}$ on a combined $C_1+C_2=6\ \mu\text{F}$.

$$\boxed{V=\dfrac{60}{6}=10\ \text{V}}$$

Energy: $324\ \mu\text{J}\to300\ \mu\text{J}$, a loss of $24\ \mu\text{J}$.

---

**The shortcut, and the one condition it needs.** The heat loss has a direct formula: $\Delta U=\dfrac{C_1C_2}{2(C_1+C_2)}(V_1-V_2)^2=\dfrac{2\times4}{2\times6}(6-12)^2=\dfrac{8}{12}\times36=24\ \mu\text{J}$ — matches, without computing $U_i$ and $U_f$ separately. This formula assumes the plates were joined **like-to-like** (matching polarity); if instead unlike plates are joined, $Q_{\text{total}}$ becomes $|Q_1-Q_2|$, not $Q_1+Q_2$, and the same-looking heat-loss formula silently gives the wrong number unless that sign is fixed first.

Counterexample: joining them unlike-to-unlike here gives $Q_{\text{total}}=|12-48|=36\ \mu\text{C}$, $V=6\ \text{V}$, and a genuinely different energy loss — reading the polarity in the circuit diagram is not optional before applying either formula.

