---
id: thermodynamics-physics.formal-definition
concept_id: thermodynamics-physics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
---

**System and boundary**: the system is a fixed quantity of gas; the boundary is the container wall or piston face across which heat and work are exchanged with the surroundings.

**Sign convention (physics, used throughout this concept)**: $Q$ = heat absorbed by the gas, positive when heat flows in (J). $W$ = work done by the gas, positive when the gas expands and pushes outward on its surroundings (J). Chemistry commonly defines work with the opposite sign ($\Delta U=Q+w$, $w$ = work done on the system) — both conventions describe identical physics; only the sign attached to the work term differs.

**Zeroth law**: if system A is in thermal equilibrium with system C, and system B is also in thermal equilibrium with C, then A and B are in thermal equilibrium with each other. This is what makes "temperature" a well-defined, comparable quantity at all.

**First law**: $\Delta U=Q-W$, with $U$ = internal energy (J).

**Work done in a process** (ideal gas, $n$ = moles, $R=8.314\ \text{J/(mol\cdot K)}$): isothermal, $W=nRT\ln(V_f/V_i)$; adiabatic, $W=\dfrac{P_1V_1-P_2V_2}{\gamma-1}$ (equivalently $W=-\Delta U$, since $Q=0$).

**Isothermal process**: $T$ constant, $PV=\text{constant}$.

**Adiabatic process**: $Q=0$ throughout, $PV^\gamma=\text{constant}$ and $TV^{\gamma-1}=\text{constant}$, where $\gamma=C_p/C_v$ is the ratio of specific heats (dimensionless).

**Second law (Kelvin–Planck form)**: no engine operating in a cycle can convert heat completely into work with no other effect.

**Carnot efficiency**: $\eta=1-\dfrac{T_2}{T_1}$, with $T_1$ = hot-reservoir temperature, $T_2$ = cold-reservoir temperature (both K). This is the maximum efficiency any engine can reach between those two temperatures.

**Coefficient of performance**: refrigerator, $\text{COP}=\dfrac{T_2}{T_1-T_2}$; heat pump, $\text{COP}=\dfrac{T_1}{T_1-T_2}$.
