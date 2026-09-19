---
id: electromagnetic-induction.interleaved-drill
concept_id: electromagnetic-induction
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
tested_by_atom: electromagnetic-induction.micro-exercise
---

**Cross-concept check: electromagnetic-induction → alternating-current.**

**Question 1 (self-inductance feeding straight into reactance):** A coil has self-inductance $L = 0.5\text{ H}$. It is connected to an AC supply whose angular frequency is $\omega = 100\text{ rad/s}$. Find the coil's inductive reactance $X_L$.

*Answer:* $X_L = \omega L = 100 \times 0.5 = 50\ \Omega$. This is the same self-inductance $L$ from Faraday and Lenz's laws — the AC concept just multiplies it by the supply's angular frequency to get an opposition measured in ohms, instead of a back-emf measured in volts.

**Question 2 (why an inductor resists an AC current at all):** In one sentence, explain why a pure inductor opposes the flow of an *alternating* current far more than it would ever oppose a steady direct current.

*Answer:* An alternating current is constantly changing, so $dI/dt$ never settles to zero — the inductor's back-emf, $\varepsilon = -L\,dI/dt$, is active at every instant and keeps fighting the current's motion, whereas a steady direct current has $dI/dt = 0$ and produces no back-emf at all once it stabilises.

**Why this drill exists:** self-inductance is often treated as a "chapter that's over" once eddy currents and energy storage are covered. It is not — it is the exact quantity that reappears as $X_L = \omega L$ the moment the current stops being steady, which is the entire premise of the next concept.
