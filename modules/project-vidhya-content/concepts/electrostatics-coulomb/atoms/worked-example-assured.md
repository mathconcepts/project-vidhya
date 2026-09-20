---
id: electrostatics-coulomb.worked-example-assured
concept_id: electrostatics-coulomb
atom_type: worked_example
variant_of: electrostatics-coulomb.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A solid conducting sphere of radius $R=0.05\ \text{m}$ carries charge $Q=4\ \mu\text{C}$ on its surface. Find $E$ at $r=0.1\ \text{m}$ from the centre.

---

**Step 1 — Symmetry, then Gauss.** Spherical symmetry lets $E$ pull out of $\oint \vec E \cdot d\vec A = Q_{\text{enc}}/\varepsilon_0$: $E(4\pi r^2) = Q/\varepsilon_0$.

$$\boxed{E = \dfrac{kQ}{r^2} = \dfrac{9\times10^9 \times 4\times10^{-6}}{0.01} = 3.6\times10^{6}\ \text{N/C}}$$

---

**Where this shortcut actually stops applying.** "Outside a uniform spherical charge, treat it as a point charge at the centre" is true **only** for $r \ge R$, and only because the sphere is uniform. That is nowhere close to a blanket fact about "anything spherical."

Counterexample: a conducting sphere with charge deliberately concentrated on one hemisphere only (not uniform) has no such symmetry — $E$ at $r=0.1\ \text{m}$ then depends on *which side* of the sphere you're measuring from, and treating $Q_{\text{enc}}$ as symmetric would silently give the wrong field. The uniformity of the charge distribution, not just the sphere's shape, is what Gauss's law needs to collapse into one line.

Same care applies **inside**: $Q_{\text{enc}}=0$ for any $r<R$ here gives $E=0$ throughout the sphere's interior — a genuinely different regime, not a smaller version of the outside answer.

