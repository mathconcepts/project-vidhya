---
id: current-electricity.worked-example-shaken
concept_id: current-electricity
atom_type: worked_example
variant_of: current-electricity.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** One loop: a $12\ \text{V}$ cell ($1\ \Omega$ internal resistance), a $4\ \Omega$ resistor, and a $6\ \text{V}$ cell ($1\ \Omega$ internal resistance) wired to oppose the first. Find the current, and each cell's terminal voltage.

---

**Step 1 — Pick a walking direction.** Walk the way the $12\ \text{V}$ cell (the stronger one) is trying to push current.

---

**Step 2 — Cross the $12\ \text{V}$ cell.** It pushes current the way you're walking, so this is a rise: $+12$.

---

**Step 3 — Cross the $6\ \text{V}$ cell.** It's wired backwards, opposing the walking direction, so this is a drop: $-6$.

---

**Step 4 — Cross all three resistances.** The $4\ \Omega$ resistor and both cells' $1\ \Omega$ internal resistances are all drops in this direction: $-4I-I-I=-6I$.

---

**Step 5 — Add it all up and solve.** $12-6-6I=0 \Rightarrow 6=6I \Rightarrow I=1\ \text{A}$.

$$\boxed{I = 1\ \text{A}}$$

---

**Step 6 — Terminal voltage, $12\ \text{V}$ cell (discharging, so subtract).** $V_1=12-(1)(1)=11\ \text{V}$.

---

**Step 7 — Terminal voltage, $6\ \text{V}$ cell (being pushed backwards, so add).** $V_2=6+(1)(1)=7\ \text{V}$.

$$\boxed{V_1=11\ \text{V},\quad V_2=7\ \text{V}}$$

---

**Step 8 — Check.** Drop across the resistor: $IR=1\times4=4\ \text{V}$. $V_1-V_2=11-7=4\ \text{V}$ — matches, confirming the loop closes correctly.

