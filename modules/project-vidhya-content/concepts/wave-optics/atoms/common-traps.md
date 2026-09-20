---
id: wave-optics.common-traps
concept_id: wave-optics
atom_type: common_traps
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
---

- **Forgetting the extra $\lambda/2$ in thin-film problems.** Reflection off a boundary going into a *denser* medium flips the wave's phase by $180^\circ$ (equivalent to an extra half-wavelength of path); reflection off a boundary into a *rarer* medium does not. A soap film in air has this extra half-wave at the front surface but not the back, and skipping it silently swaps which thickness gives a bright film and which gives a dark one.

- **Confusing the single-slit dark-fringe formula with the double-slit bright-fringe formula.** Both look like "(something) $\sin\theta = n\lambda$", but $a\sin\theta=n\lambda$ (single slit, slit *width* $a$) marks **dark** bands, while $d\sin\theta=n\lambda$ (double slit, slit *separation* $d$) marks **bright** ones. The letter used for the quantity, and whether the result is bright or dark, both flip between the two setups.

- **Applying Malus's law with the wrong angle.** $I=I_0\cos^2\theta$ needs $\theta$ measured between the polariser's transmission axis and the *actual* polarisation direction of the light hitting it — not the angle between two polarisers' physical mounting marks, if the light passing between them has already been rotated by an earlier polariser.

- **Mixing up Brewster's angle with the critical angle.** Brewster's angle, $\tan\theta_B=n$, is about *polarising* the reflected ray at a refracting boundary — it exists for any transparent interface. The critical angle, $\sin\theta_c=1/n$, is about *total internal reflection* and only applies going from a denser medium into a rarer one. Different formulas, different physical effects, easily swapped under time pressure.

- **Treating the small-angle path-difference formula, $\Delta\approx dy/D$, as exact everywhere.** It is only valid when $y$ and $d$ are both much smaller than $D$ — true for essentially every JEE Main YDSE numeric value, but not a universal identity; the exact expression is $\Delta = d\sin\theta$.
