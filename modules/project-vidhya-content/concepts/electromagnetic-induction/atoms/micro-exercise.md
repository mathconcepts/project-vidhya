---
id: electromagnetic-induction.micro-exercise
concept_id: electromagnetic-induction
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.4
estimated_minutes: 2
exam_ids: ["*"]
---

A coil of area $0.01\text{ m}^2$ sits with its face perpendicular to a magnetic field that *increases* steadily from $0.2\text{ T}$ to $0.8\text{ T}$ in $0.3$ seconds. What is the magnitude of the induced emf, and does the induced current's own magnetic field point the same way as the applied field, or the opposite way?

A) $0.01\text{ V}$; same way
B) $0.02\text{ V}$; opposite way
C) $0.02\text{ V}$; same way
D) $0.2\text{ V}$; opposite way
E) $0.2\text{ V}$; same way

<details>
<summary>Answer</summary>

**Correct answer: B) $0.02\text{ V}$; opposite way.**

Rate of change: $\dfrac{0.8-0.2}{0.3} = 2\text{ T/s}$. Emf: $\varepsilon = A \times |dB/dt| = 0.01 \times 2 = 0.02\text{ V}$.

The field here is *increasing*, so the induced current opposes that increase by building a field in the **opposite** direction to the applied field — this is the one case where "opposes the field" happens to give the right direction, because the change and the field's own direction agree.

**Why the others fail:**
- A) and E) get the direction backwards — they would be correct only if the field were decreasing, not increasing.
- C) gets the direction backwards for the same reason as A) and E), while also under-computing the rate of change relative to D.
- D) uses the correct direction but drops the factor of $A=0.01$, effectively treating $dB/dt$ itself as the emf.

</details>
