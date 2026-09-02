---
# Alternative body for boolean-algebra.worked-example, stance `shaken`.
id: boolean-algebra.worked-example.shaken
concept_id: boolean-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: boolean-algebra.worked-example
for_stance: shaken
---

**Problem:** Minimize $F(A,B,C)=\Sigma m(1,3,5,6,7)$ using a Karnaugh map.

---

**Step 1 — Write each minterm in binary.** $1{=}001,\ 3{=}011,\ 5{=}101,\ 6{=}110,\ 7{=}111$.

---

**Step 2 — Note the last bit ($C$) of each.** $001\to1$, $011\to1$, $101\to1$, $110\to0$, $111\to1$. Four of five have $C=1$.

---

**Step 3 — Group those four.** Minterms $1,3,5,7$ all have $C=1$: one group, literal $C$.

---

**Step 4 — Handle the leftover minterm.** $6=110$ is not covered. Pair it with $7=111$ (reusing it is fine): both have $A=1,B=1$.

---

**Step 5 — Group those two.** Minterms $6,7$: one group, literal $AB$.

---

**Step 6 — Combine with OR.** $F=C+AB$.

$$\boxed{F = C + AB}$$

Check: $m6=110$: $C=0$, $AB=1$, sum$=1$ ✓. $m4=100$ (not a minterm): $C=0,AB=0$, sum$=0$, correctly excluded.
