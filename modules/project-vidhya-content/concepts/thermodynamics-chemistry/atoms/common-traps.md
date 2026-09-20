---
id: thermodynamics-chemistry.common-traps
concept_id: thermodynamics-chemistry
atom_type: common_traps
bloom_level: 4
difficulty: 0.45
exam_ids: ["*"]
---

- **Forgetting the kJ vs. J unit mismatch between $\Delta H$ and $\Delta S$**: $\Delta H$ is conventionally given in kJ/mol while $\Delta S$ is given in J/(mol$\cdot$K) — a factor of 1000 apart. Substituting both directly into $\Delta G=\Delta H-T\Delta S$ without converting one of them first produces an answer wrong by roughly a factor of 1000, while still looking like a plausible number.

- **Carrying the physics work-sign convention into a chemistry problem**: chemistry's $\Delta U=q+w$ takes $w$ as work done *on* the system; physics often uses $\Delta U=q-w$ with $w$ as work done *by* the system. Mixing the two conventions flips the sign of every work term.

- **Assuming exothermic ($\Delta H<0$) automatically means spontaneous**: spontaneity needs $\Delta G<0$, not $\Delta H<0$ alone — an exothermic reaction with a large enough entropy decrease can still be non-spontaneous at high temperature.

- **Using Hess's Law arithmetic on an unbalanced set of steps**: adding given step-reactions without first checking that intermediate species genuinely cancel (same substance, opposite side) produces a $\Delta H$ that does not actually belong to the target overall reaction.

- **Treating $\Delta H_f^\circ$ of an element in its standard state as anything other than zero**: e.g. $\Delta H_f^\circ$ of $\text{O}_2(g)$ is $0$ by definition, not a value to look up or compute.
