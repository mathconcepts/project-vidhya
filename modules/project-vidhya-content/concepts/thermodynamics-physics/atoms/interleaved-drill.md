---
id: thermodynamics-physics.interleaved-drill
concept_id: thermodynamics-physics
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
tested_by_atom: thermodynamics-physics.micro-exercise
---

**Cross-concept check: thermodynamics-physics → kinetic-theory.**

**Question 1 (heat supplied, from the first law):** A rigid container holds $n=1$ mol of a monatomic ideal gas at $T_1=300$ K. At constant volume, it is heated until $T_2=700$ K. How much heat was supplied?

*Answer:* Constant volume means $W=0$, so $\Delta U=Q$. For a monatomic gas, $\Delta U=\frac{3}{2}nR\Delta T=\frac{3}{2}(1)(8.314)(400)=4988.4$ J. So $Q=4988.4$ J.

**Question 2 (the same heating, seen from kinetic theory):** By what factor does the rms speed of the gas's molecules increase over this same heating?

*Answer:* $v_{rms}\propto\sqrt{T}$, so the factor is $\sqrt{T_2/T_1}=\sqrt{700/300}\approx1.53$ — the molecules end up moving about $53\%$ faster on average, even though the heat supplied and the temperature rise came from a purely thermodynamic bookkeeping calculation with no mention of molecular speed at all.

**Why this drill exists:** the same rise in temperature is, at once, a first-law heat-supplied number (thermodynamics-physics) and a molecular-speed-increase number (kinetic-theory) — $T$ is the single quantity both descriptions are built on. Treating the two topics as unrelated calculations, rather than two views of the same rising $T$, is the error this drill is built to catch.
