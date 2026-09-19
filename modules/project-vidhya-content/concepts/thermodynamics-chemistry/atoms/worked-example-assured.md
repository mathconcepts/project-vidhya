---
id: thermodynamics-chemistry.worked-example-assured
concept_id: thermodynamics-chemistry
atom_type: worked_example
variant_of: thermodynamics-chemistry.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.5
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** For a reaction, $\Delta H = -58$ kJ/mol and $\Delta S = -175$ J/(mol$\cdot$K). Is the reaction spontaneous at $T=300$ K?

---

**Step 1 — Unit-match and substitute in one pass.** $\Delta G = \Delta H - T\Delta S = -58 - 300\left(\dfrac{-175}{1000}\right) = -58 + 52.5 = -5.5$ kJ/mol.

$$\boxed{\Delta G=-5.5 \text{ kJ/mol, spontaneous}}$$

---

**The genuinely useful next question: find the crossover temperature where this stops being true.** Set $\Delta G=0$: $T = \dfrac{\Delta H}{\Delta S} = \dfrac{-58 \times 1000}{-175} \approx 331$ K.

Since both $\Delta H<0$ and $\Delta S<0$ here, raising $T$ makes $-T\Delta S$ *more* positive, working against the reaction — above $\approx 331$ K, this reaction flips to non-spontaneous. This is the opposite behaviour from a $\Delta H<0,\Delta S>0$ reaction (always spontaneous, at every $T$) or a $\Delta H>0,\Delta S<0$ reaction (never spontaneous, at any $T$): only when $\Delta H$ and $\Delta S$ share the same sign does a genuine crossover temperature exist at all, and its direction (spontaneous below or above it) depends on which sign they share.
