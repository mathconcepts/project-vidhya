---
id: kinetic-theory.interleaved-drill
concept_id: kinetic-theory
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
modality: drill
tested_by_atom: kinetic-theory.micro-exercise
---

**Cross-concept check: kinetic-theory → thermodynamics-physics.**

**Question 1 (a rigid container, so all the heat becomes internal energy):** A rigid, sealed vessel holds $n=2$ mol of a diatomic gas ($N_2$). Heat $Q=2000$ J is supplied at constant volume. Find the rise in temperature.

*Answer:* Volume is constant, so the gas does no work on its surroundings: $W=0$. By the first law, $\Delta U=Q-W=Q=2000$ J. For a diatomic gas, $\Delta U=\frac{5}{2}nR\Delta T$, so $\Delta T=\dfrac{2000}{\frac{5}{2}(2)(8.314)}=\dfrac{2000}{41.57}\approx48.1$ K. The kinetic-theory formula for $U$ is doing all the real work here — thermodynamics only supplied the fact that $W=0$.

**Question 2 (same heat, different gas, different answer):** The identical heat, $Q=2000$ J, is instead supplied at constant volume to $n=2$ mol of a monatomic gas. Find the new $\Delta T$, and explain why it differs from Question 1's answer.

*Answer:* $\Delta U=\frac{3}{2}nR\Delta T=Q$, so $\Delta T=\dfrac{2000}{\frac{3}{2}(2)(8.314)}=\dfrac{2000}{24.942}\approx80.2$ K — noticeably larger than $48.1$ K. The same heat spreads across fewer degrees of freedom ($3$ instead of $5$), so each one absorbs a larger share, and temperature — which measures energy per degree of freedom, not total energy — rises faster.

**Why this drill exists:** a thermodynamics first-law problem at constant volume always reduces to a kinetic-theory question about degrees of freedom the moment $W$ drops out. Skipping the "monatomic or diatomic" check silently swaps $\frac{3}{2}$ for $\frac{5}{2}$ (or the reverse) and gets a confidently wrong temperature.
