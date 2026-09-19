---
id: units-and-measurements.worked-example-assured
concept_id: units-and-measurements
atom_type: worked_example
variant_of: units-and-measurements.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** The side of a metal cube is measured with a vernier caliper as $a = 2.20$ cm, with a possible error of $\Delta a = 0.01$ cm. Find the volume of the cube, with its error, correctly reported.

---

**Step 1 — Rule and raw value.** $V=a^3$ is a single-quantity power, so $\dfrac{\Delta V}{V}=3\dfrac{\Delta a}{a}$. $V=2.20^3=10.648$ cm$^3$.

---

**Step 2 — Errors.** $\dfrac{\Delta a}{a}=0.45\%$, so $\dfrac{\Delta V}{V}=1.36\%$, giving $\Delta V \approx 0.1$ cm$^3$.

$$\boxed{V = (10.6 \pm 0.1)\ \text{cm}^3}$$

---

**Where an examiner actually catches a wrong assumption: the multiplying power is per-variable, never per-formula.** If the formula instead mixed two quantities at *different* powers — say $Z = a^2/b$ — a frequent slip is applying one shared "power" to the whole expression. It does not work that way: each variable's relative error is scaled by *its own* exponent before the terms are added, $\dfrac{\Delta Z}{Z} = 2\dfrac{\Delta a}{a} + 1\dfrac{\Delta b}{b}$, never $3\left(\dfrac{\Delta a}{a}+\dfrac{\Delta b}{b}\right)$ just because the exponents happen to sum to $3$. $V=a^3$ only looks like "multiply by $3$" because all three factors are the *same* variable $a$; that coincidence disappears the moment two different measured quantities enter at different powers.

