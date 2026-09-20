---
id: electrostatics-coulomb.common-traps
concept_id: electrostatics-coulomb
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Drawing the field of a negative charge pointing outward.** The electric field always points in the direction a *positive* test charge would be pushed. Near a negative charge, that direction is *inward*, towards it — not outward like a positive charge's field. Drawing arrows the same way for both signs flips every downstream answer about force direction.

- **Reaching for Gauss's law when there's no symmetry to exploit.** Gauss's law is always true, but it only becomes solvable when a symmetry (spherical, cylindrical, or planar) lets you argue $E$ is constant over a chosen surface. For two arbitrarily placed point charges or an irregular charged object, there is no such surface — direct Coulomb's law and vector superposition is the only route in, however tempting it is to reach for the "one-line" formula.

- **Treating "$D\ge0$"-style location leniency for force problems too.** Halving the distance in Coulomb's law quadruples the force, not doubles it — $F\propto 1/r^2$, not $1/r$. Forgetting to square the distance ratio is the single most common arithmetic slip in this topic.

- **Confusing the field just outside a conductor with a bare point-charge field.** $E=\sigma/\varepsilon_0$ just outside a charged conductor's surface depends on the *local* surface charge density $\sigma$, which is not the same everywhere on a non-spherical conductor — it is much larger near sharp points or corners. Dividing the total charge by the total area and calling that $\sigma$ everywhere silently assumes a uniformity that isn't there.

