---
id: redox-and-electrochemistry.worked-example
concept_id: redox-and-electrochemistry
atom_type: worked_example
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A galvanic cell is set up as $\text{Zn}(s)\,|\,\text{Zn}^{2+}(0.01\ M)\,\|\,\text{Cu}^{2+}(1.0\ M)\,|\,\text{Cu}(s)$. Given $E^\circ(\text{Cu}^{2+}/\text{Cu})=+0.34\ \text{V}$ and $E^\circ(\text{Zn}^{2+}/\text{Zn})=-0.76\ \text{V}$, find the cell potential at $298\ \text{K}$.

---

**Step 1 — Count what is conserved before writing any formula.** The overall reaction is $\text{Zn} + \text{Cu}^{2+} \rightarrow \text{Zn}^{2+} + \text{Cu}$: each zinc atom releases $2$ electrons, and each $\text{Cu}^{2+}$ ion takes up $2$ — so $n=2$ electrons are transferred per unit of reaction, and this $n$ is what goes into every formula below.

---

**Step 2 — Standard cell potential.** Copper is reduced, so it is the cathode; zinc is oxidised, so it is the anode. $E^\circ_{\text{cell}} = E^\circ_{\text{cathode}} - E^\circ_{\text{anode}} = 0.34 - (-0.76) = 1.10\ \text{V}$.

---

**Step 3 — Reaction quotient $Q$.** Solids ($\text{Zn}$, $\text{Cu}$) do not appear in $Q$; only the dissolved ions do. $Q = \dfrac{[\text{Zn}^{2+}]}{[\text{Cu}^{2+}]} = \dfrac{0.01}{1.0} = 0.01$.

---

**Step 4 — Apply the Nernst equation at $298\ \text{K}$.** $E_{\text{cell}} = E^\circ_{\text{cell}} - \dfrac{0.0591}{n}\log_{10}Q = 1.10 - \dfrac{0.0591}{2}\log_{10}(0.01) = 1.10 - (0.02955)(-2)$.

$$\boxed{E_{\text{cell}} = 1.10 + 0.0591 = 1.1591\ \text{V} \approx 1.16\ \text{V}}$$

---

**Step 5 — Check the direction.** $Q<1$ means the product side ($\text{Zn}^{2+}$) is thinner than the reactant side ($\text{Cu}^{2+}$) compared to standard conditions — the reaction is pulled forward even more eagerly, so the cell potential should rise ABOVE $1.10\ \text{V}$. It did, to $1.16\ \text{V}$, confirming the direction.
