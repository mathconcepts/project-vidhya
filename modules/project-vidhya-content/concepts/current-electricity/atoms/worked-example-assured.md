---
id: current-electricity.worked-example-assured
concept_id: current-electricity
atom_type: worked_example
variant_of: current-electricity.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A loop has a $12\ \text{V}$ cell ($1\ \Omega$), a $4\ \Omega$ resistor, and an opposing $6\ \text{V}$ cell ($1\ \Omega$). Find $I$ and each cell's terminal voltage.

---

**Step 1 — Net emf, then Ohm's law over the whole loop.** Opposing emfs subtract: net emf $=12-6=6\ \text{V}$, total resistance $=4+1+1=6\ \Omega$.

$$\boxed{I=\dfrac{6}{6}=1\ \text{A}}$$

$$\boxed{V_1=12-(1)(1)=11\ \text{V},\quad V_2=6+(1)(1)=7\ \text{V}}$$

---

**The one assumption this shortcut is quietly making.** "Net emf $=$ sum with signs, total resistance $=$ plain sum" is a genuine shortcut for a **single loop with everything in series** — it silently assumes there is only one path for current, so every element shares the same $I$. A network with more than one loop breaks that assumption completely.

Counterexample: add a second resistor in parallel with the $4\ \Omega$ one. Now two different currents exist (one per loop), and "total resistance $=$ plain sum" no longer describes the circuit at all — the two loop equations have to be written and solved together, current by current, rather than collapsed into one net-emf-over-net-resistance line. Reach for this shortcut once the circuit itself has confirmed that no second loop exists to split the current.

