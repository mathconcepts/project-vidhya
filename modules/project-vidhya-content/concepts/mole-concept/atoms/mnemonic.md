---
id: mole-concept.mnemonic
concept_id: mole-concept
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Mass in, mole out; mole in, particles out."** Every conversion in this concept moves one step at a time along the same chain: mass $\to$ moles (divide by molar mass) $\to$ particles (multiply by $N_A$). Never skip a link in the chain.

**For limiting reagent: "divide by the coefficient, smallest wins."** Take each reactant's moles, divide by its own coefficient in the balanced equation, and whichever gives the smaller number is the limiting reagent — every time, with no exceptions.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag mass and molar mass — watch moles and particle count update live",
  "why": "Moles and particle count are just mass divided by molar mass, then multiplied by Avogadro's number — drag either slider and watch both numbers rebuild instantly, for any substance, not only the magnesium example above.",
  "inputs": [
    {"id": "mass", "label": "mass (g)", "min": 2, "max": 98, "step": 1, "initial": 24},
    {"id": "molar_mass", "label": "molar mass (g/mol)", "min": 10, "max": 100, "step": 1, "initial": 24}
  ],
  "outputs": [
    {"label": "Moles = mass / molar mass", "formula": "mass/molar_mass", "digits": 3},
    {"label": "Particles (x 10^23)", "formula": "(mass/molar_mass)*6.022", "digits": 3}
  ],
  "caption": "Start at mass=24, molar_mass=24 (like one mole of magnesium): moles should read 1.000 and particles 6.022 (x10^23), matching Avogadro's number exactly. Drag either slider and watch both numbers update from the two given values alone."
}
```
