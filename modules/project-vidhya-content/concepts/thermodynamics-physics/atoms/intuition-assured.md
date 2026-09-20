---
id: thermodynamics-physics.intuition-assured
concept_id: thermodynamics-physics
atom_type: intuition
variant_of: thermodynamics-physics.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

$PV^\gamma=\text{constant}$ holds only for a reversible **adiabatic** process — one specific type of process, not a general property of an ideal gas. Using it during an **isothermal** process is a real, mark-costing error, since isothermal processes obey the plainer $PV=\text{constant}$ (Boyle's law) instead, with no $\gamma$ anywhere in it.

Counterexample: $1$ mol of a monatomic gas ($\gamma=5/3$) at $T=300$ K doubles its volume isothermally. The correct final pressure, from $P_1V_1=P_2V_2$, is exactly $P_1/2$. Applying $PV^\gamma=\text{constant}$ instead — as if the process were adiabatic — gives $P_2=P_1(0.5)^{5/3}\approx0.315P_1$, a smaller and simply wrong pressure. The two formulas agree only when $\gamma=1$, which no real gas ever has.

Knowing *which* process a question describes is therefore not optional bookkeeping — it decides which of two genuinely different equations gives the right final pressure.
