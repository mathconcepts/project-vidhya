---
id: alternating-current.worked-example-shaken
concept_id: alternating-current
atom_type: worked_example
variant_of: alternating-current.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A series LCR circuit has $R = 30\ \Omega$, inductive reactance $X_L = 50\ \Omega$, and capacitive reactance $X_C = 10\ \Omega$, driven by a supply of peak voltage $V_0 = 200\text{ V}$. Find the impedance, the peak current, the phase angle between voltage and current, and the average power delivered.

---

**Step 1 — Subtract the two reactances.** $X_L - X_C = 50 - 10 = 40\ \Omega$.

---

**Step 2 — Compute the impedance.** $Z = \sqrt{30^2 + 40^2} = \sqrt{2500} = 50\ \Omega$.

---

**Step 3 — Divide to get peak current.** $I_0 = 200/50 = 4\text{ A}$.

---

**Step 4 — Compute the phase angle.** $\tan\phi = 40/30 = 4/3 \Rightarrow \phi \approx 53.13^\circ$, current lagging since $X_L > X_C$.

---

**Step 5 — Convert to rms and multiply for power.** $V_{rms} = 200/\sqrt2 \approx 141.4\text{ V}$, $I_{rms} = 4/\sqrt2 \approx 2.83\text{ A}$, $\cos\phi = 30/50 = 0.6$. $P_{avg} = 141.4 \times 2.83 \times 0.6 \approx 240\text{ W}$.

---

**Step 6 — Run the check.** $I_{rms}^2R = (2.83)^2 \times 30 \approx 240\text{ W}$ — matches Step 5 exactly.

$$\boxed{Z = 50\ \Omega, \quad I_0 = 4\text{ A}, \quad \phi \approx 53.13^\circ, \quad P_{avg} \approx 240\text{ W}}$$
