---
id: counting-principles.worked-example
concept_id: counting-principles
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
---

**Problem.** A GATE study group has 5 women and 4 men. A 4-person team is chosen at random from these 9 people. In how many ways can a team with **at least 2 women** be formed?

---

**Step 1 — Pick a strategy.** "At least 2" out of a team of 4 means 2, 3, or 4 women. Three cases is manageable, but the complement — teams with *fewer than* 2 women (0 or 1) — is only two cases. Complement is faster; use it.

---

**Step 2 — Count the total, unrestricted.** Choosing any 4 of the 9 people: $C(9,4) = \dfrac{9!}{4!\,5!} = 126$.

---

**Step 3 — Count the excluded cases.** Zero women means all 4 come from the 4 men: $C(4,4) = 1$. One woman means 1 of 5 women and 3 of 4 men: $C(5,1)\cdot C(4,3) = 5\cdot4 = 20$. Excluded total: $1+20=21$.

---

**Step 4 — Subtract.**
$$\boxed{126 - 21 = 105}$$

**Check (direct case count).** 2 women + 2 men: $C(5,2)C(4,2)=10\cdot6=60$. 3 women + 1 man: $C(5,3)C(4,1)=10\cdot4=40$. 4 women: $C(5,4)=5$. Sum: $60+40+5=105$ ✓ — matches the complement route exactly.
