---
id: thermodynamics-physics.worked-example
concept_id: thermodynamics-physics
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A Carnot engine (the system is the working gas; its boundary exchanges heat with a hot reservoir at $T_1=600$ K and a cold reservoir at $T_2=300$ K) absorbs $Q_1=1000$ J of heat from the hot reservoir every cycle. Find (a) the engine's efficiency, (b) the work output per cycle, and (c) the heat rejected to the cold reservoir.

---

**Step 1 — Efficiency depends only on the two temperatures.** $\eta=1-\dfrac{T_2}{T_1}=1-\dfrac{300}{600}=0.5$, i.e. $50\%$.

---

**Step 2 — Work output.** Efficiency is defined as $\eta=W/Q_1$, so $W=\eta Q_1=(0.5)(1000)=500$ J.

---

**Step 3 — Heat rejected, from energy conservation.** Over one full cycle the engine returns to its starting state, so $\Delta U=0$ for the cycle, giving $Q_1-Q_2=W$ (net heat in equals work out). So $Q_2=Q_1-W=1000-500=500$ J.

---

**Step 4 — State all three together.** $\boxed{\eta=50\%,\quad W=500\ \text{J},\quad Q_2=500\ \text{J}}$. Exactly half the absorbed heat became work; the other half was rejected to the cold reservoir, not lost — the second law requires *some* rejection, it never allows all of $Q_1$ to become work.
