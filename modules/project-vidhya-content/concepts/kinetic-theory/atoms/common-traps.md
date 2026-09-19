---
id: kinetic-theory.common-traps
concept_id: kinetic-theory
atom_type: common_traps
bloom_level: 4
difficulty: 0.35
exam_ids: ["*"]
---

- **Using molar mass in grams instead of kilograms**: every speed formula ($v_{rms}$, $v_{avg}$, $v_p$) needs $M$ in kg/mol. Leaving $M=32$ (grams, for oxygen) instead of $M=0.032$ inflates the computed speed by a factor of $\sqrt{1000}\approx31.6$ — a wrong number that can still look plausible on a quick glance.

- **Writing internal energy as $U=\frac{3}{2}nRT$ for every gas**: this is only correct for a monatomic gas (three degrees of freedom). A diatomic gas ($N_2$, $O_2$) at ordinary temperatures has five degrees of freedom (three translational, two rotational), so $U=\frac{5}{2}nRT$ — a genuinely larger number, not a rounding difference.

- **Confusing average velocity with average speed (or rms speed)**: the *vector* average velocity of all molecules in a gas is zero, since they move in every direction and cancel out. Average *speed* and rms *speed* are both nonzero, because taking magnitude (or squaring) before averaging removes that cancellation.

- **Assuming doubling temperature doubles molecular speed**: $v_{rms}\propto\sqrt{T}$, not $T$ itself. Doubling absolute temperature multiplies rms speed by only $\sqrt{2}\approx1.41$, not by $2$.

- **Using Celsius instead of kelvin**: $T$ in every kinetic theory formula must be absolute temperature. Forgetting to add $273$ when a problem states a temperature in $^\circ\text{C}$ silently understates every speed and every energy calculated from it.
