---
id: redox-and-electrochemistry.worked-example-shaken
concept_id: redox-and-electrochemistry
atom_type: worked_example
variant_of: redox-and-electrochemistry.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A galvanic cell is set up as $\text{Zn}(s)\,|\,\text{Zn}^{2+}(0.01\ M)\,\|\,\text{Cu}^{2+}(1.0\ M)\,|\,\text{Cu}(s)$. Given $E^\circ(\text{Cu}^{2+}/\text{Cu})=+0.34\ \text{V}$ and $E^\circ(\text{Zn}^{2+}/\text{Zn})=-0.76\ \text{V}$, find the cell potential at $298\ \text{K}$.

---

**Step 1 — Write down the overall reaction and count electrons.** $\text{Zn} + \text{Cu}^{2+} \rightarrow \text{Zn}^{2+} + \text{Cu}$. Each $\text{Zn}$ atom loses $2$ electrons; each $\text{Cu}^{2+}$ ion gains $2$. So $n=2$.

---

**Step 2 — Identify anode and cathode.** Copper is reduced ($\text{Cu}^{2+}\rightarrow\text{Cu}$): cathode. Zinc is oxidised ($\text{Zn}\rightarrow\text{Zn}^{2+}$): anode.

---

**Step 3 — Standard cell potential.** $E^\circ_{\text{cell}} = E^\circ_{\text{cathode}} - E^\circ_{\text{anode}} = 0.34 - (-0.76) = 0.34+0.76 = 1.10\ \text{V}$.

---

**Step 4 — Write $Q$ using only dissolved species.** $Q = \dfrac{[\text{Zn}^{2+}]}{[\text{Cu}^{2+}]} = \dfrac{0.01}{1.0} = 0.01$.

---

**Step 5 — Compute $\log_{10}Q$ and the correction term.** $\log_{10}(0.01) = -2$. Correction term: $\dfrac{0.0591}{2}\times(-2) = -0.0591$.

---

**Step 6 — Subtract the correction from $E^\circ_{\text{cell}}$.** $E_{\text{cell}} = 1.10 - (-0.0591) = 1.10+0.0591 = 1.1591\ \text{V}$.

$$\boxed{E_{\text{cell}} \approx 1.16\ \text{V}}$$

---

**Step 7 — Check.** $Q<1$ favours the forward reaction, so $E_{\text{cell}}$ should exceed $E^\circ_{\text{cell}}$ — $1.16 > 1.10$, confirming the direction.
