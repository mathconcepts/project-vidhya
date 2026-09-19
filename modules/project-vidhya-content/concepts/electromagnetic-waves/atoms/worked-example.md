---
id: electromagnetic-waves.worked-example
concept_id: electromagnetic-waves
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A parallel-plate capacitor with plate area $A = 0.02\text{ m}^2$ is being charged by a steady current $I = 2\text{ A}$. Find the rate of change of the electric field between the plates, and show that the resulting displacement current equals $I$.

---

**Step 1 — Field between the plates.** For a parallel-plate capacitor, $E = \dfrac{Q}{\varepsilon_0 A}$, so its rate of change is $\dfrac{dE}{dt} = \dfrac{1}{\varepsilon_0 A}\dfrac{dQ}{dt} = \dfrac{I}{\varepsilon_0 A}$.

---

**Step 2 — Substitute numbers.** $\dfrac{dE}{dt} = \dfrac{2}{(8.85\times10^{-12})(0.02)} \approx 1.13\times10^{13}\text{ V/(m\cdot s)}$.

---

**Step 3 — Displacement current.** $I_d = \varepsilon_0 A \dfrac{dE}{dt} = \varepsilon_0 A \times \dfrac{I}{\varepsilon_0 A} = I = 2\text{ A}$.

$$\boxed{I_d = 2\text{ A}}$$

The $\varepsilon_0 A$ that was multiplied in cancels exactly against the $\varepsilon_0 A$ underneath the fraction from Step 1 — this is not a coincidence for these particular numbers, it is a general algebraic identity: for *any* parallel-plate capacitor being charged, the displacement current between the plates always equals the conduction current feeding it.
