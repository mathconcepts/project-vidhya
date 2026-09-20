---
id: alternating-current.worked-example-assured
concept_id: alternating-current
atom_type: worked_example
variant_of: alternating-current.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A series LCR circuit has $R = 30\ \Omega$, inductive reactance $X_L = 50\ \Omega$, and capacitive reactance $X_C = 10\ \Omega$, driven by a supply of peak voltage $V_0 = 200\text{ V}$. Find the impedance, the peak current, the phase angle, and the average power delivered.

---

**Step 1 — $Z$ and $I_0$, as always.** $Z = \sqrt{30^2+40^2} = 50\ \Omega$, so $I_0 = 200/50 = 4\text{ A}$.

---

**Step 2 — Skip the phase angle entirely for the power.** Only $R$ dissipates energy, so $P_{avg} = I_{rms}^2R$ needs nothing from $\phi$ or $\cos\phi$: $I_{rms} = 4/\sqrt2 \approx 2.83\text{ A}$, $P_{avg} \approx (2.83)^2 \times 30 \approx 240\text{ W}$.

$$\boxed{Z = 50\ \Omega, \quad I_0 = 4\text{ A}, \quad \phi \approx 53.13^\circ, \quad P_{avg} \approx 240\text{ W}}$$

**Why this shortcut only covers the power, not the whole problem.** $I_{rms}^2R$ gets $P_{avg}$ without ever computing $\phi$ — a real time saver when a question asks only for power. But it gives *nothing* if the question separately asks for the phase angle or the power factor by name: those require $\tan\phi = (X_L-X_C)/R$ regardless, since $P_{avg} = I_{rms}^2R$ never mentions $\phi$ at all and cannot be inverted to recover it.
