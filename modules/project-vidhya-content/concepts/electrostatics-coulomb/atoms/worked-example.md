---
id: electrostatics-coulomb.worked-example
concept_id: electrostatics-coulomb
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A solid conducting sphere of radius $R = 0.05\ \text{m}$ ($5\ \text{cm}$) carries a total charge $Q = 4\ \mu\text{C}$, spread uniformly over its surface, and sits alone in air. Find the electric field at a point $r = 0.1\ \text{m}$ from the sphere's centre (outside the sphere).

---

**Step 1 — Set up the geometry.** The charge sits on a sphere, so the whole arrangement is spherically symmetric: the field at any point outside must point radially (straight out from the centre) and have the same magnitude at every point the same distance away. This symmetry is exactly what makes Gauss's law the fast route here — there is no comparable symmetry to exploit if the charge sat on, say, an irregular lump.

---

**Step 2 — Choose the Gaussian surface.** Draw an imaginary sphere of radius $r=0.1\ \text{m}$, centred on the same point, passing through the point where the field is wanted. Because $E$ is constant in magnitude over this whole imaginary sphere and always perpendicular to it, $E$ can be pulled straight out of the integral.

---

**Step 3 — Apply Gauss's law.** $\oint \vec E \cdot d\vec A = E \cdot (4\pi r^2) = \dfrac{Q_{\text{enc}}}{\varepsilon_0}$. Since the whole charge $Q$ sits inside this imaginary sphere, $Q_{\text{enc}} = Q = 4\times10^{-6}\ \text{C}$.

---

**Step 4 — Solve for $E$.** $E = \dfrac{Q}{4\pi\varepsilon_0 r^2} = \dfrac{kQ}{r^2} = \dfrac{9\times10^9 \times 4\times10^{-6}}{(0.1)^2}$.

$$\boxed{E = 3.6\times10^{6}\ \text{N/C}}$$

---

**Why this looks exactly like a point-charge formula.** Outside a uniformly charged sphere, Gauss's law proves the field is identical to that of a single point charge $Q$ sitting at the centre — that is not an assumption, it *falls out* of the symmetry argument. This shortcut only holds for points **outside** the sphere ($r \ge R$); for a point inside a uniformly charged conducting sphere, the enclosed charge $Q_{\text{enc}} = 0$, so $E = 0$ there — a completely different answer that the same formula would get wrong if applied blindly inside.

