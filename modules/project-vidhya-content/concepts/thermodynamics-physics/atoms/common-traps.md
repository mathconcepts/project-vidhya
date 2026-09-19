---
id: thermodynamics-physics.common-traps
concept_id: thermodynamics-physics
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Mixing up the work-sign convention**: physics writes $\Delta U=Q-W$, with $W$ = work *done by* the gas, positive when the gas expands. Chemistry commonly writes $\Delta U=Q+w$, with $w$ = work *done on* the system, positive when the surroundings compress it. Both describe the same physics correctly on their own — the error is substituting a work value computed under one convention into the other convention's formula, which silently flips the sign of the answer.

- **Treating "adiabatic" and "isothermal" as interchangeable**: adiabatic means $Q=0$ (no heat crosses the boundary) — temperature is free to change, and usually does. Isothermal means $T$ is held constant — heat is free to flow, and usually does, to keep it that way. A process can be one, the other, both (only for a trivial, no-change process), or neither; assuming "not isothermal" implies "adiabatic," or the reverse, is a genuine, common error.

- **Using $PV^\gamma=\text{constant}$ for a non-adiabatic process**: this relation is specific to a reversible adiabatic process. An isothermal process obeys the plainer $PV=\text{constant}$ instead — using the wrong one gives a wrong final pressure or volume, not just an imprecise one.

- **Forgetting to convert temperature to kelvin**: every thermodynamics formula here (Carnot efficiency, adiabatic relations, COP) needs absolute temperature. Leaving a value in Celsius produces a confidently wrong, sometimes physically impossible, answer (an "efficiency" above what the second law allows).

- **Assuming heat rejected equals zero for an efficient engine**: the second law guarantees some heat must always be rejected to the cold reservoir in any cyclic engine; only a $100\%$-efficient engine (which cannot exist) would reject none.
