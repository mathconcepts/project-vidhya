---
id: alternating-current.intuition
concept_id: alternating-current
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

Picture two arrows (**phasors**) spinning counter-clockwise around the same centre, at the same steady rate $\omega$ — one arrow's vertical shadow traces out the voltage, the other's traces out the current, over time. Whenever a real quantity in an AC circuit is written as $A\sin(\omega t + \phi)$, that quantity's phasor is simply an arrow of length $A$, sitting at angle $\phi$ ahead of a reference arrow, spinning at $\omega$.

For the coil in the hook, the voltage phasor and current phasor spin together, locked at the same rate — but the current phasor always sits a fixed quarter-turn ($90^\circ$) *behind* the voltage phasor. That fixed gap between the two arrows, not the instant-by-instant wiggling of either sine curve, is what "phase difference" really is: two spinning arrows, permanently offset by an angle that depends only on what the circuit is made of, not on the moment you happen to look at it.

This is exactly the same back-emf that opposes changing current in self-inductance — a coil never lets its current change instantly, so the current is always chasing the voltage that is trying to push it, arriving one quarter-turn late.
