---
id: electromagnetic-waves.worked-example-assured
concept_id: electromagnetic-waves
atom_type: worked_example
variant_of: electromagnetic-waves.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A parallel-plate capacitor with plate area $A = 0.02\text{ m}^2$ is being charged by a steady current $I = 2\text{ A}$. Find the displacement current between the plates.

---

**Step 1 — Skip the numeric field calculation entirely.** $I_d = \varepsilon_0 A\,dE/dt$ and $dE/dt = I/(\varepsilon_0 A)$ combine algebraically before any number is substituted: $I_d = \varepsilon_0 A \times \dfrac{I}{\varepsilon_0 A} = I$.

$$\boxed{I_d = 2\text{ A}}$$

**Why this is not a special case of these numbers.** The $\varepsilon_0 A$ cancels for *any* plate area and *any* permittivity — this is a general identity for a parallel-plate capacitor, not a numeric coincidence of $A=0.02\text{ m}^2$. The one place the identity would need adjusting is a capacitor with a *changing* geometry (plates moving apart while charging) — there $A$ itself depends on time and cannot be pulled outside the derivative, so $I_d = I$ would no longer hold exactly.
