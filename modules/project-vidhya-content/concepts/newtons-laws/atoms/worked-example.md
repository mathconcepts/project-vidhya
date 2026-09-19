---
id: newtons-laws.worked-example
concept_id: newtons-laws
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A block of mass $m_1=3$ kg rests on a frictionless horizontal table. It is connected by a light, inextensible string over a frictionless, massless pulley at the table's edge to a hanging block of mass $m_2=2$ kg. Take $g=10$ m/s$^2$. Find the acceleration of the system and the tension in the string.

---

**Step 0 — Set up the physical situation, frame, and sign convention before any formula.** Two separate free-body diagrams, one per block, since they experience different forces. For $m_1$ (on the table): take "toward the pulley" as positive. The only horizontal force on it is the string's tension $T$, pulling it toward the pulley. For $m_2$ (hanging): take "downward" as positive. Two forces act on it: gravity $m_2g$ (downward, positive) and tension $T$ (upward, negative in this block's own convention). Because the string is inextensible and passes over one pulley, both blocks share the same magnitude of acceleration $a$, each measured positive in its own chosen direction.

---

**Step 1 — Newton's second law for $m_1$.** Only $T$ acts along its direction of motion: $T = m_1a$.

---

**Step 2 — Newton's second law for $m_2$.** $m_2g - T = m_2a$.

---

**Step 3 — Add the two equations to eliminate $T$.** $(T)+(m_2g-T) = m_1a+m_2a \Rightarrow m_2g = (m_1+m_2)a$.

---

**Step 4 — Solve for $a$.** $a = \dfrac{m_2g}{m_1+m_2} = \dfrac{2(10)}{3+2} = \dfrac{20}{5}=4$ m/s$^2$.

---

**Step 5 — Substitute back to find $T$.** From Step 1: $T=m_1a=3(4)=12$ N.

$$\boxed{a = 4\ \text{m/s}^2, \qquad T = 12\ \text{N}}$$

---

**Check using the equation for $m_2$ instead.** $m_2g-T = 2(10)-12=20-12=8$ N, and $m_2a=2(4)=8$ N. The two sides agree, confirming $a$ and $T$ are consistent with *both* free-body diagrams, not just the one used to derive them.

