---
id: alternating-current.intuition-assured
concept_id: alternating-current
atom_type: intuition
variant_of: alternating-current.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

Reading a phasor diagram is second nature by now, so notice what it silently leaves out: it fixes the phase *relationship between components in one circuit at one frequency* only — it says nothing about how that relationship shifts once the frequency itself is changed.

Counterexample: raise $\omega$ in an LCR series circuit, and the inductor's reactance $X_L = \omega L$ grows while the capacitor's reactance $X_C = 1/(\omega C)$ shrinks. The phasor diagram redraws itself at every frequency — the angle between voltage and current phasors is not a fixed property of "this circuit", it is a function of $\omega$ that happens to pass through $0^\circ$ exactly at resonance. Treating one snapshot phasor diagram as valid "for the circuit" rather than "for this one frequency" is precisely the assumption that resonance problems are built to break.
