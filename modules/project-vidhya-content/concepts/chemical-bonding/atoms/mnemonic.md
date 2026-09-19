---
id: chemical-bonding.mnemonic
concept_id: chemical-bonding
atom_type: mnemonic
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: mnemonic
---

**"Shape, Mix, Stability — VSEPR, Hybrid, MO."** In that order: VSEPR gives the **shape**, hybridisation gives the orbital **mix** that produces it, MO theory gives the bond's **stability** (order) and whether it is magnetic.

**For formal charge: "Own half, keep the rest."** An atom "keeps" its lone-pair electrons fully, and "owns" only half of each bonding pair — that halving is the one step most often skipped.

**"Balloons don't care what's tied to them."** VSEPR spreads lone pairs and bonding pairs apart identically — a lone pair pushes just as hard as a bonded atom, even though only the bonded atom shows up in the final drawn shape.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag bonding and antibonding electron counts — watch the bond order update live",
  "why": "Bond order is just half the difference between bonding and antibonding electrons — drag either slider and watch the number rebuild instantly, for any diatomic molecule, not only oxygen or nitrogen.",
  "inputs": [
    {"id": "bonding", "label": "bonding electrons", "min": 2, "max": 10, "step": 2, "initial": 8},
    {"id": "antibonding", "label": "antibonding electrons", "min": 0, "max": 8, "step": 2, "initial": 4}
  ],
  "outputs": [
    {"label": "Bond order = (bonding - antibonding) / 2", "formula": "(bonding-antibonding)/2", "digits": 2}
  ],
  "caption": "Start at bonding=8, antibonding=4 (like O2): bond order should read 2.00, a double bond. Drag antibonding down to 2 (like N2's effective count relative to its 10 bonding electrons) to see the order rise toward a triple bond."
}
```
