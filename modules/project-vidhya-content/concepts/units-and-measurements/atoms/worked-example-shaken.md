---
id: units-and-measurements.worked-example-shaken
concept_id: units-and-measurements
atom_type: worked_example
variant_of: units-and-measurements.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** The side of a metal cube is measured with a vernier caliper as $a = 2.20$ cm, with a possible error of $\Delta a = 0.01$ cm. Find the volume of the cube, with its error, correctly reported.

---

**Step 1 — Write down exactly what is known.** One measurement, $a=2.20$ cm. Its error is $\Delta a=0.01$ cm. $a$ has $3$ significant figures: the digits $2$, $2$, and $0$ (the zero counts because there is a decimal point after it).

---

**Step 2 — Name the formula and which rule it needs.** $V=a^3$ is a *power* of a single measured quantity. The power rule says: $\dfrac{\Delta V}{V} = 3 \times \dfrac{\Delta a}{a}$.

---

**Step 3 — Compute the raw volume.** $V = 2.20 \times 2.20 \times 2.20$. First $2.20 \times 2.20 = 4.84$. Then $4.84 \times 2.20 = 10.648$. So $V=10.648$ cm$^3$ on a calculator.

---

**Step 4 — Compute the relative error in $a$.** $\dfrac{\Delta a}{a} = \dfrac{0.01}{2.20} = 0.004545...$, which is $0.45\%$ once written as a percentage.

---

**Step 5 — Apply the power rule.** $\dfrac{\Delta V}{V} = 3 \times 0.45\% = 1.36\%$.

---

**Step 6 — Convert back to an absolute error.** $\Delta V = 1.36\% \times 10.648 = 0.145$ cm$^3$, rounded to one significant figure: $0.1$ cm$^3$.

---

**Step 7 — State the final answer, checking the digit count matches.** $\boxed{V = (10.6 \pm 0.1)\ \text{cm}^3}$. Check: $10.6$ has $3$ significant figures, matching $a$'s $3$ significant figures — exactly what a power of a single measurement should preserve, no more and no fewer.

