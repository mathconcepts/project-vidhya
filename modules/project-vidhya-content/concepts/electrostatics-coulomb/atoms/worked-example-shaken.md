---
id: electrostatics-coulomb.worked-example-shaken
concept_id: electrostatics-coulomb
atom_type: worked_example
variant_of: electrostatics-coulomb.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A solid conducting sphere of radius $R=0.05\ \text{m}$ carries charge $Q=4\ \mu\text{C}$ spread over its surface. Find $E$ at $r=0.1\ \text{m}$ from the centre, outside the sphere.

---

**Step 1 — Name the shape.** The charge is spread over a sphere. That is spherical symmetry: $E$ must be the same size at every point the same distance from the centre, and must point straight outward.

---

**Step 2 — Because of that symmetry, pick Gauss's law.** No other tool needs this little algebra when the shape is this symmetric.

---

**Step 3 — Draw the imaginary sphere.** Radius $r=0.1\ \text{m}$, same centre, passing through the point asked about.

---

**Step 4 — Write Gauss's law and simplify.** $E \cdot (4\pi r^2) = Q_{\text{enc}}/\varepsilon_0$. All of $Q=4\times10^{-6}\ \text{C}$ sits inside this imaginary sphere, so $Q_{\text{enc}}=Q$.

---

**Step 5 — Solve.** $E = \dfrac{kQ}{r^2} = \dfrac{9\times10^9 \times 4\times10^{-6}}{0.01}$.

$$\boxed{E = 3.6\times10^{6}\ \text{N/C}}$$

---

**Step 6 — Check it makes sense.** This is the same number Coulomb's law alone would give for a point charge $Q$ sitting right at the centre — expected, since Gauss's law proves the two are identical outside a uniformly charged sphere. Inside the sphere, though, $Q_{\text{enc}}=0$ and $E=0$ — a different region, a different answer.

