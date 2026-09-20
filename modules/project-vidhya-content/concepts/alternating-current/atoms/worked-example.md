---
id: alternating-current.worked-example
concept_id: alternating-current
atom_type: worked_example
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A series LCR circuit has $R = 30\ \Omega$, inductive reactance $X_L = 50\ \Omega$, and capacitive reactance $X_C = 10\ \Omega$, driven by a supply of peak voltage $V_0 = 200\text{ V}$. Find the impedance, the peak current, the phase angle between voltage and current, and the average power delivered.

---

**Step 1 — Net reactance.** $X_L - X_C = 50 - 10 = 40\ \Omega$. Since $X_L > X_C$, the circuit is net inductive: current lags voltage.

---

**Step 2 — Impedance.** $Z = \sqrt{R^2 + (X_L-X_C)^2} = \sqrt{30^2 + 40^2} = \sqrt{900+1600} = \sqrt{2500} = 50\ \Omega$.

---

**Step 3 — Peak current.** $I_0 = \dfrac{V_0}{Z} = \dfrac{200}{50} = 4\text{ A}$.

---

**Step 4 — Phase angle.** $\tan\phi = \dfrac{X_L-X_C}{R} = \dfrac{40}{30} = \dfrac{4}{3} \Rightarrow \phi \approx 53.13^\circ$, current lagging.

---

**Step 5 — Average power.** Power factor $\cos\phi = R/Z = 30/50 = 0.6$. Using rms values, $V_{rms} = 200/\sqrt2 \approx 141.4\text{ V}$ and $I_{rms} = I_0/\sqrt2 \approx 2.83\text{ A}$:

$$P_{avg} = V_{rms}I_{rms}\cos\phi \approx 141.4 \times 2.83 \times 0.6 \approx 240\text{ W}$$

$$\boxed{Z = 50\ \Omega, \quad I_0 = 4\text{ A}, \quad \phi \approx 53.13^\circ \text{ (lag)}, \quad P_{avg} \approx 240\text{ W}}$$

---

**Check.** Average power should also equal $I_{rms}^2 R$, since resistance is the only element that actually dissipates energy: $(2.83)^2 \times 30 \approx 240\text{ W}$ — matches. The reactance never appears in this second calculation at all, because a pure inductor or capacitor stores and returns energy every cycle without dissipating any of it.
