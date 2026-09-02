---
id: recurrence-relations.worked-example
concept_id: recurrence-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Solve $a_n=5a_{n-1}-6a_{n-2}$ with $a_0=2,\ a_1=5$. Find a closed form and evaluate $a_4$.

---

**Step 1 — Write the characteristic equation.** $x^2-5x+6=0$.

---

**Step 2 — Solve for the roots.** $x^2-5x+6=(x-2)(x-3)=0 \Rightarrow x=2,\ 3$. Distinct roots.

---

**Step 3 — Write the general solution and apply initial conditions.** $a_n=A\cdot2^n+B\cdot3^n$. At $n=0$: $A+B=2$. At $n=1$: $2A+3B=5$. Subtracting twice the first from the second: $(2A+3B)-2(A+B)=5-4 \Rightarrow B=1$, so $A=1$.

---

**Step 4 — Write the closed form and evaluate.** $a_n=2^n+3^n$. Then $a_4=2^4+3^4=16+81=97$.

$$\boxed{a_n = 2^n+3^n,\quad a_4=97}$$

Check: compute directly from the recurrence instead. $a_2=5(5)-6(2)=13$, $a_3=5(13)-6(5)=35$, $a_4=5(35)-6(13)=175-78=97$ — matches.
