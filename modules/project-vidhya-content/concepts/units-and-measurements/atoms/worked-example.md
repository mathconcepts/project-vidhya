---
id: units-and-measurements.worked-example
concept_id: units-and-measurements
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** The side of a metal cube is measured with a vernier caliper as $a = 2.20$ cm, with the instrument's least count (smallest change it can detect) giving a possible error of $\Delta a = 0.01$ cm. Find the volume of the cube, with its error, correctly reported.

---

**Step 0 — Name the measured quantity and its rule, before touching a formula.** One measured length, $a$, with $3$ significant figures ($2$, $2$, $0$ — the trailing zero counts because there is a decimal point). The volume $V=a^3$ is a *power* of a single measured quantity, so the power-error rule applies: $\dfrac{\Delta V}{V} = 3\dfrac{\Delta a}{a}$.

---

**Step 1 — Compute the raw volume.** $V = a^3 = 2.20^3 = 10.648$ cm$^3$.

---

**Step 2 — Compute the relative error in $a$.** $\dfrac{\Delta a}{a} = \dfrac{0.01}{2.20} \approx 0.00455$, i.e. about $0.45\%$.

---

**Step 3 — Apply the power rule to get the relative error in $V$.** $\dfrac{\Delta V}{V} = 3 \times 0.45\% = 1.36\%$.

---

**Step 4 — Convert to an absolute error and round to sensible figures.** $\Delta V = 1.36\% \times 10.648 \approx 0.145$ cm$^3$, which rounds to $0.1$ cm$^3$ — an error is never reported to more than one or two significant figures, since the error itself is only a rough bound.

$$\boxed{V = (10.6 \pm 0.1)\ \text{cm}^3}$$

---

**Why the volume is reported as $10.6$, not $10.648$.** $a$ carries $3$ significant figures, so $V=a^3$ can carry at most $3$ significant figures too — multiplying a number by itself does not manufacture extra precision. Reporting $10.648$ would claim knowledge of the cube's volume to five figures when the length was only ever known to three; the calculator's extra digits are arithmetic noise, not measured information.

