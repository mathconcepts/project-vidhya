---
id: boolean-algebra.worked-example
concept_id: boolean-algebra
atom_type: worked_example
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Minimize $F(A,B,C)=\Sigma m(1,3,5,6,7)$ using a Karnaugh map.

---

**Step 1 — Write each minterm in binary $(A,B,C)$.** $1{=}001,\ 3{=}011,\ 5{=}101,\ 6{=}110,\ 7{=}111$.

---

**Step 2 — Place the $1$s on a $3$-variable K-map.** Rows $AB\in\{00,01,11,10\}$, column $C\in\{0,1\}$. $1$s land at $(AB{=}00,C{=}1)$, $(AB{=}01,C{=}1)$, $(AB{=}10,C{=}1)$, $(AB{=}11,C{=}0)$, $(AB{=}11,C{=}1)$.

---

**Step 3 — Find the largest valid groups.** The entire $C=1$ column has all four $1$s ($m1,3,5,7$): one $4$-cell group $\Rightarrow$ literal $C$. The $AB{=}11$ row has both cells filled ($m6,7$): one $2$-cell group $\Rightarrow$ literal $AB$ (dropping $C$, since both values of $C$ appear).

---

**Step 4 — Combine the groups with OR.** Every minterm is covered by exactly one of the two groups ($m7$ is covered by both, and overlap is allowed).

$$\boxed{F = C + AB}$$

Check: evaluate $F=C+AB$ at each minterm — $m6=110$: $C=0,AB=1\cdot1=1$, sum $=1$ ✓. $m1=001$: $C=1$ ✓. All five minterms confirmed, and $m4=100$ (not in the list) gives $C=0,AB=0$, sum$=0$, correctly excluded.
