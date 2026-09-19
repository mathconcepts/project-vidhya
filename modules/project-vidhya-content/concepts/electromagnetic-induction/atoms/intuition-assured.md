---
id: electromagnetic-induction.intuition-assured
concept_id: electromagnetic-induction
atom_type: intuition
variant_of: electromagnetic-induction.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
---

The same "opposes the change, not the state" idea shows up again in self-inductance, and it is where students overreach. The back-emf of an inductor is $\varepsilon = -L\dfrac{dI}{dt}$ — it depends only on how fast current is *changing*, never on how large the current is at that instant.

Counterexample: an inductor carrying a steady $5\text{ A}$ direct current, unchanging, has $dI/dt = 0$ and therefore **zero** back-emf — despite carrying five times the current of some other circuit with $1\text{ A}$ that is *changing* rapidly and generating a large back-emf. A large steady current is not automatically a large opposing effect; a small but rapidly changing one can dominate it completely. Treating an inductor like a resistor that "pushes back" harder as current grows silently swaps a rate-dependent law for a magnitude-dependent one, and gets a steady-current question backwards.
