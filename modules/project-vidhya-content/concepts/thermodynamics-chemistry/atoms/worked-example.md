---
id: thermodynamics-chemistry.worked-example
concept_id: thermodynamics-chemistry
atom_type: worked_example
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** For a reaction, $\Delta H = -58$ kJ/mol and $\Delta S = -175$ J/(mol$\cdot$K). Is the reaction spontaneous at $T=300$ K?

---

**Step 1 — Count what is being combined: an enthalpy term and an entropy term, so match their units first.** $\Delta H$ is in kJ/mol; $\Delta S$ is in J/(mol$\cdot$K) — 1000 times smaller a unit. Convert $\Delta S$ to kJ/(mol$\cdot$K): $-175$ J $= -0.175$ kJ.

---

**Step 2 — Compute $T\Delta S$.** $T\Delta S = 300 \times (-0.175) = -52.5$ kJ/mol.

---

**Step 3 — Apply $\Delta G = \Delta H - T\Delta S$.** $\Delta G = -58 - (-52.5) = -58 + 52.5 = -5.5$ kJ/mol.

$$\boxed{\Delta G = -5.5 \text{ kJ/mol}}$$

---

**Step 4 — Read the sign.** $\Delta G<0$, so the reaction is spontaneous at $300$ K.

---

**Why this can't be answered from $\Delta H$'s sign alone.** $\Delta H=-58$ kJ/mol being negative only says the reaction *releases* heat — it says nothing on its own about spontaneity, because $\Delta S<0$ (disorder decreasing) works against it. Only combining both into $\Delta G$ settles the question; here the enthalpy term wins, but at a high enough temperature the entropy term would eventually win instead.
