---
id: solid-state.worked-example
concept_id: solid-state
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** A metal crystallises in a body-centred cubic (bcc) structure. Its density is $7.2\ \text{g/cm}^3$ and its molar mass is $52\ \text{g/mol}$. Find the edge length of its unit cell, in picometres.

---

**Step 1 — Count what bcc actually fixes before reaching for the density formula.** A bcc structure fixes $Z=2$ (one corner contribution of $1$ plus one full body-centred atom) — this number goes directly into the density formula, and using the wrong $Z$ (say, $1$ or $4$, from a different structure) would silently produce a wrong edge length.

---

**Step 2 — Rearrange the density formula for $a^3$.** $\rho=\dfrac{ZM}{N_Aa^3} \Rightarrow a^3=\dfrac{ZM}{N_A\rho}=\dfrac{2\times52}{(6.022\times10^{23})(7.2)}$.

---

**Step 3 — Compute $a^3$.** $a^3=\dfrac{104}{4.336\times10^{24}}\approx2.40\times10^{-23}\ \text{cm}^3$.

---

**Step 4 — Take the cube root, then convert units.** $a\approx2.88\times10^{-8}\ \text{cm}$.

$$\boxed{a \approx 288\ \text{pm}}$$

(since $1\ \text{cm}=10^{10}\ \text{pm}$: $2.88\times10^{-8}\ \text{cm}\times10^{10}=288\ \text{pm}$)

---

**Step 5 — Check the size makes sense.** A few hundred picometres is the right order of magnitude for a metallic atom's spacing — an answer of, say, $2.88\ \text{pm}$ or $2.88\times10^{-2}\ \text{pm}$ would immediately flag a units slip somewhere in the conversion.
