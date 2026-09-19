---
id: current-electricity.common-traps
concept_id: current-electricity
atom_type: common_traps
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
---

- **Losing track of Kirchhoff sign bookkeeping mid-loop.** Once a walking direction and a current direction are chosen, every crossing must follow the same rule for the rest of that loop: a resistor crossed *with* the assumed current is a drop, crossed *against* it is a rise; a cell crossed $-$ to $+$ is a rise, $+$ to $-$ is a drop. Switching the rule partway through the same loop (common when a diagram is redrawn mid-solution) silently flips one term's sign and wrecks the whole equation.

- **Treating emf and terminal voltage as always equal.** They are equal only in the special case of zero current (an open circuit, or a fully charged cell just disconnected). The instant current flows, $V_{\text{terminal}}=\text{emf}-Ir$ (discharging) or $\text{emf}+Ir$ (being charged) — never just the emf on its own.

- **Confusing resistance with resistivity.** Resistivity ($\rho$) is a material constant; resistance ($R=\rho L/A$) also depends on a wire's length and cross-sectional area. Two wires of the same material can have completely different resistances, and two wires of different materials can happen to have the same resistance.

- **Assuming a balanced Wheatstone bridge means no current flows anywhere in the circuit.** Balance ($P/Q=R/S$) only forces zero current through the *galvanometer branch* — current still flows through every other arm of the bridge exactly as normal.

