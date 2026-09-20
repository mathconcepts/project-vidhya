---
id: thermodynamics-physics.intuition-shaken
concept_id: thermodynamics-physics
atom_type: intuition
variant_of: thermodynamics-physics.intuition
for_stance: shaken
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Take $n=1$ mol of ideal gas at $T=300$ K, expanding isothermally (temperature held fixed) until its volume doubles.

**Step 1 — work done by the gas.** $W=nRT\ln(V_f/V_i)=(1)(8.314)(300)\ln(2)\approx1729$ J.

**Step 2 — internal energy at fixed temperature.** For an ideal gas at constant $T$, $\Delta U=0$. Using $\Delta U=Q-W$: $0=Q-1729$, so $Q=1729$ J. Every joule of work came in as heat; none came from the gas's own stored energy.

**Step 3 — repeat the same expansion adiabatically instead** (no heat exchange at all, $Q=0$). Now $\Delta U=-W$: whatever work the gas does subtracts directly from its own internal energy, so its temperature drops as it expands. The same expansion done adiabatically ends up colder, and does less work, than the isothermal version — because no heat arrives from outside to keep topping the gas up.

**Step 4 — a heat engine's ceiling.** An engine running between $T_1=500$ K and $T_2=300$ K has maximum efficiency $\eta=1-300/500=0.4$: even the best possible engine turns only $40\%$ of the heat it absorbs into work. The rest must be rejected to the cold reservoir — a limit set by the second law, not by poor engineering.
