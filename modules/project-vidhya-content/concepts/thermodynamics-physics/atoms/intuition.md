---
id: thermodynamics-physics.intuition
concept_id: thermodynamics-physics
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

Picture the same trapped gas as before: the system is the gas itself, and the boundary is whatever container wall or piston separates it from everything else. Two different things can cross that boundary — heat, $Q$, and work, $W$ — and the first law of thermodynamics is simply bookkeeping for both: whatever energy crosses in has to show up somewhere, either raised as internal energy or carried back out as work.

**Sign convention used here (the physics one)**: $\Delta U=Q-W$, where $Q$ is heat absorbed *by* the gas (positive when heat flows in) and $W$ is work done *by* the gas (positive when the gas expands and pushes outward on its surroundings). Chemistry commonly uses the opposite sign for work, $\Delta U=Q+w$ with $w$ = work done *on* the system — the same physics, just with the work term flipped. Both are self-consistent on their own; trouble starts only when a formula from one gets mixed with a number meant for the other.

Two named processes matter most. **Isothermal**: temperature stays fixed throughout, which needs a slow process in continuous contact with a heat reservoir, so heat keeps flowing to hold $T$ constant while work is done. **Adiabatic**: no heat crosses the boundary at all ($Q=0$), usually because the process happens too fast for heat to escape — here $\Delta U=-W$ exactly, so any work the gas does comes entirely out of its own internal energy, and temperature necessarily changes. These are genuinely different physical situations, not two names for the same idea.

The second law adds a constraint bookkeeping alone misses: heat never flows on its own from a colder body to a hotter one, and no engine converts heat into work with $100\%$ efficiency. A Carnot engine, running between a hot reservoir at $T_1$ and a cold one at $T_2$ (both in kelvin), sets the best efficiency any real engine between those two temperatures could ever reach: $\eta=1-T_2/T_1$.
