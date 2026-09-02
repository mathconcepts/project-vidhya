---
# Alternative body for recurrence-relations.worked-example, stance `shaken`.
id: recurrence-relations.worked-example.shaken
concept_id: recurrence-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
scaffold_fade: true
variant_of: recurrence-relations.worked-example
for_stance: shaken
---

**Problem:** Solve $a_n=5a_{n-1}-6a_{n-2}$ with $a_0=2,\ a_1=5$. Find a closed form and evaluate $a_4$.

---

**Step 1 — Characteristic equation.** Replace $a_n$ with $x^n$: $x^2-5x+6=0$.

---

**Step 2 — Factor.** Two numbers multiplying to $6$, adding to $5$: $2$ and $3$. $(x-2)(x-3)=0$.

---

**Step 3 — Roots.** $x=2$ or $x=3$, distinct.

---

**Step 4 — General form.** $a_n=A\cdot2^n+B\cdot3^n$.

---

**Step 5 — Apply $a_0=2$.** $A+B=2$.

---

**Step 6 — Apply $a_1=5$.** $2A+3B=5$.

---

**Step 7 — Solve.** $A=2-B$; substitute: $2(2-B)+3B=5\Rightarrow B=1,\ A=1$.

---

**Step 8 — Evaluate.** $a_n=2^n+3^n$; $a_4=16+81=97$.

$$\boxed{a_n=2^n+3^n,\ a_4=97}$$

Check: $5(35)-6(13)=97$ ✓.
