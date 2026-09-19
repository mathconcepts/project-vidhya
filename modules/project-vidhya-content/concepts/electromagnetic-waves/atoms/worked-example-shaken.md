---
id: electromagnetic-waves.worked-example-shaken
concept_id: electromagnetic-waves
atom_type: worked_example
variant_of: electromagnetic-waves.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A parallel-plate capacitor with plate area $A = 0.02\text{ m}^2$ is being charged by a steady current $I = 2\text{ A}$. Find the rate of change of the electric field between the plates, and show that the resulting displacement current equals $I$.

---

**Step 1 — Write the field formula.** $E = \dfrac{Q}{\varepsilon_0 A}$.

---

**Step 2 — Differentiate both sides with respect to time.** $\dfrac{dE}{dt} = \dfrac{1}{\varepsilon_0 A}\dfrac{dQ}{dt} = \dfrac{I}{\varepsilon_0 A}$, since $dQ/dt$ is exactly the charging current $I$.

---

**Step 3 — Plug in the numbers.** $\dfrac{dE}{dt} = \dfrac{2}{(8.85\times10^{-12})(0.02)} \approx 1.13\times10^{13}\text{ V/(m\cdot s)}$.

---

**Step 4 — Substitute into the displacement-current formula.** $I_d = \varepsilon_0 A \dfrac{dE}{dt} = (8.85\times10^{-12})(0.02)(1.13\times10^{13})$.

---

**Step 5 — Multiply it out and compare.** This gives $I_d \approx 2\text{ A}$ — exactly the conduction current stated in the problem.

$$\boxed{I_d = 2\text{ A}}$$
