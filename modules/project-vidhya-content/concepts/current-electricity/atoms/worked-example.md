---
id: current-electricity.worked-example
concept_id: current-electricity
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A single loop contains a $12\ \text{V}$ cell (internal resistance $1\ \Omega$), a $4\ \Omega$ resistor, and a second $6\ \text{V}$ cell (internal resistance $1\ \Omega$) connected so that it opposes the first cell — its emf pushes current the opposite way around the same loop. Find the current in the loop, and the terminal voltage of each cell.

---

**Step 1 — Describe the circuit before writing any equation.** One loop, three elements in series: the $12\ \text{V}$ cell driving current one way, a $4\ \Omega$ resistor, and the $6\ \text{V}$ cell wired backwards relative to the first, so it fights the current the $12\ \text{V}$ cell is trying to push. Pick a walking direction around the loop — the direction the stronger, $12\ \text{V}$ cell is trying to drive current.

---

**Step 2 — Write the loop equation with signs from that walking direction.** The $12\ \text{V}$ cell is crossed as a rise ($+12$). The $6\ \text{V}$ cell, wired backwards, is crossed as a drop ($-6$) — this is exactly the sign bookkeeping that "opposing" means. Both resistances (the $4\ \Omega$ external resistor and both cells' $1\ \Omega$ internal resistances) are drops in this direction: $-4I-1\cdot I-1\cdot I$.

---

**Step 3 — Solve for $I$.** $12-6-4I-I-I=0 \Rightarrow 6=6I \Rightarrow I=1\ \text{A}$.

$$\boxed{I = 1\ \text{A}}$$

---

**Step 4 — Terminal voltage of the $12\ \text{V}$ cell (discharging).** $V_1=\text{emf}_1-Ir_1=12-(1)(1)=11\ \text{V}$.

---

**Step 5 — Terminal voltage of the $6\ \text{V}$ cell (being forced backwards, i.e. being charged by the loop current).** $V_2=\text{emf}_2+Ir_2=6+(1)(1)=7\ \text{V}$.

$$\boxed{V_1 = 11\ \text{V}, \quad V_2 = 7\ \text{V}}$$

---

**Why the two terminal-voltage formulas differ here.** The $12\ \text{V}$ cell is discharging — driving current the way it wants to — so its own internal resistance eats *into* its emf, giving $\text{emf}-Ir$. The $6\ \text{V}$ cell is being forced to accept current against its own emf (it is effectively being charged by the stronger cell), so the same current now adds to its emf instead of subtracting, giving $\text{emf}+Ir$. Using $\text{emf}-Ir$ for both cells here, without checking which one is actually being driven backwards, is the single most common mistake in this kind of problem. Check: the drop across the resistor is $IR=1\times4=4\ \text{V}$, and $V_1-V_2=11-7=4\ \text{V}$ — matches, confirming Kirchhoff's loop rule holds all the way around.

