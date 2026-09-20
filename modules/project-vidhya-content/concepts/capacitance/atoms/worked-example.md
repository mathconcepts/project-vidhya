---
id: capacitance.worked-example
concept_id: capacitance
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Capacitor A ($C_1=2\ \mu\text{F}$) is charged to $V_1=6\ \text{V}$ and then disconnected from its battery. Capacitor B ($C_2=4\ \mu\text{F}$) is charged separately to $V_2=12\ \text{V}$ and disconnected too. Their positive plates are now connected to each other, and their negative plates are connected to each other. Find (a) the common final voltage, and (b) the energy lost in the process.

---

**Step 1 — Describe the circuit before connecting anything.** Two isolated, pre-charged capacitors, each carrying a fixed amount of charge sitting on its own plates, are about to be wired together plate-to-like-plate (positive to positive). Once connected this way, they behave as a single parallel combination sharing one common voltage.

---

**Step 2 — Find each capacitor's charge before connecting.** $Q_1=C_1V_1=2\times6=12\ \mu\text{C}$. $Q_2=C_2V_2=4\times12=48\ \mu\text{C}$.

---

**Step 3 — Apply charge conservation.** Connecting positive to positive means the charges add: $Q_{\text{total}}=Q_1+Q_2=12+48=60\ \mu\text{C}$. The combined capacitance, now that they share the same two nodes, is $C_1+C_2=6\ \mu\text{F}$.

---

**Step 4 — Find the common voltage.** $V=\dfrac{Q_{\text{total}}}{C_1+C_2}=\dfrac{60}{6}=10\ \text{V}$.

$$\boxed{V = 10\ \text{V}}$$

---

**Step 5 — Compare energy before and after.** Energy before: $U_i=\tfrac12 C_1V_1^2+\tfrac12 C_2V_2^2=\tfrac12(2)(36)+\tfrac12(4)(144)=36+288=324\ \mu\text{J}$. Energy after: $U_f=\tfrac12(C_1+C_2)V^2=\tfrac12(6)(100)=300\ \mu\text{J}$.

$$\boxed{U_i - U_f = 24\ \mu\text{J lost}}$$

---

**Why energy is lost even though charge is conserved.** Charge cannot disappear, so it is exactly conserved. Energy is different: the moment the two capacitors are joined, current briefly flows between them through whatever finite resistance the connecting wires have, and that current dissipates energy as heat — exactly like any current through a resistor does. Charge conservation and energy conservation are two separate bookkeeping rules here; only the first one gives a clean equality.

