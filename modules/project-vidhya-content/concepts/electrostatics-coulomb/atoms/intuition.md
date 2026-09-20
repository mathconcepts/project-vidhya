---
id: electrostatics-coulomb.intuition
concept_id: electrostatics-coulomb
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Picture the **electric field** (the push-per-unit-charge a positive test charge would feel at a point) as arrows spreading out of a positive charge, and arrows pouring into a negative one. A **positive** test charge placed near a positive source is pushed away, along the arrow. Near a **negative** source, the field arrow points *towards* the negative charge — so a positive test charge is pulled in, not pushed out. Getting this direction backwards for a negative charge is the single most common sign slip in this whole topic.

**Gauss's law** ($\oint \vec E \cdot d\vec A = Q_{\text{enc}}/\varepsilon_0$, where $Q_{\text{enc}}$ is the charge enclosed by an imaginary closed surface and $\varepsilon_0$ is a constant called the permittivity of free space) is always *true*, but it is only *useful* as a shortcut when the charge arrangement has enough symmetry to guess the field's shape in advance.

- **Symmetry exists → Gauss's law is the fast route.** A uniformly charged sphere, an infinite charged sheet, or a long charged cylinder — in each case you can argue, from symmetry alone, that $\vec E$ has the same magnitude everywhere on a chosen surface and points straight through it. Then $E$ pulls out of the integral and the whole law becomes one line of algebra.
- **No symmetry → Gauss's law is useless as a shortcut.** Two point charges sitting at odd positions, or an oddly-shaped charged object, give no way to guess how $E$ varies over any surface you could draw. The law is still true, but you cannot pull $E$ out of the integral — direct Coulomb's law and vector addition (superposition) is the only way in.

Deciding *which* situation you're in, before reaching for either tool, is the actual skill this concept tests.

