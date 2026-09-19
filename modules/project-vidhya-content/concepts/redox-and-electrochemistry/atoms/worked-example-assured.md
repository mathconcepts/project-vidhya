---
id: redox-and-electrochemistry.worked-example-assured
concept_id: redox-and-electrochemistry
atom_type: worked_example
variant_of: redox-and-electrochemistry.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.55
exam_ids: ["*"]
scaffold_fade: true
---

The Nernst step above needs $Q$ built from the reaction exactly as written, PRODUCTS over reactants — flip that ratio by mistake, and the sign of the whole correction term flips with it.

Using $Q = [\text{Cu}^{2+}]/[\text{Zn}^{2+}] = 1.0/0.01 = 100$ instead (reactant over product, backwards) gives $E_{\text{cell}} = 1.10 - (0.0591/2)\log_{10}(100) = 1.10 - 0.0591 = 1.04\ \text{V}$ — moving the potential the WRONG way, since diluting the product side should always push the reaction further forward and raise the potential, not lower it.

**Writing $Q$ correctly is necessary, and checking the direction of the shift is the fastest way to catch a $Q$ that was accidentally inverted.** A concentration change that favours the forward reaction (thinner product, thicker reactant, exactly what happened by diluting $\text{Zn}^{2+}$ here) must always raise $E_{\text{cell}}$ above $E^\circ_{\text{cell}}$ — never lower it.
