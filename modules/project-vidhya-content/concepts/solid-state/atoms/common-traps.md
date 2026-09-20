---
id: solid-state.common-traps
concept_id: solid-state
atom_type: common_traps
bloom_level: 4
difficulty: 0.35
exam_ids: ["*"]
---

- **Forgetting to convert the edge length to centimetres before cubing it**: $\rho=ZM/(N_Aa^3)$ needs $a$ in centimetres, since density is conventionally $\text{g/cm}^3$ and $N_A$ is per mole. Cubing an edge length still in picometres (or even metres) without converting first throws the answer off by a huge, easy-to-miss power of ten — always convert BEFORE cubing, not after.

- **Confusing coordination number with $Z$ (atoms per unit cell)**: coordination number counts how many neighbours touch ONE atom; $Z$ counts how many whole atoms belong to the unit cell as a whole. fcc has coordination number $12$ but $Z=4$ — two genuinely different numbers describing two different things.

- **Using the simple-cubic relationship $a=2r$ for every structure**: atoms touch along the edge only in simple cubic. bcc atoms touch along the body diagonal ($\sqrt{3}a=4r$); fcc atoms touch along a face diagonal ($\sqrt{2}a=4r$). Using $a=2r$ regardless of structure gives a wrong packing efficiency for bcc and fcc.

- **Assuming a Schottky defect changes a crystal's overall charge**: it does not — a Schottky defect removes a cation AND an anion together, in the same ratio the compound already has, so the crystal stays exactly neutral. Only the DENSITY drops, since mass is lost while the unit cell's volume barely changes.

- **Assuming any point defect lowers density**: a Frenkel defect does NOT lower density, since the displaced ion stays inside the crystal (just in an interstitial gap instead of its normal site) — no mass actually leaves. Only a Schottky defect (where ions leave the crystal entirely) measurably lowers density.
