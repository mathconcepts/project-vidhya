---
id: thermodynamics-chemistry.mnemonic
concept_id: thermodynamics-chemistry
atom_type: mnemonic
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: mnemonic
---

**"Happy minus Tea-Sad" for $\Delta G = \Delta H - T\Delta S$.** $H$ for Happy (heat released feels good), $S$ for Sad (disorder), $T$ scales how much the "Sad" term matters.

**"Chemistry gives, Physics takes"** for the $w$ sign clash: chemistry's $w$ is work done *on* (given to) the system; physics's $w$ is work done *by* (taken from) the system.

**"Same start, same end, any road"** for Hess's Law: $\Delta H$ only cares about the starting reactants and ending products, never the path of intermediate steps between them.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag dH, dS and T — watch Gibbs free energy update live",
  "why": "Spontaneity comes from combining enthalpy and entropy into one number, weighted by temperature — drag any slider and watch dG rebuild instantly, for any reaction, not only the cold-pack example above.",
  "inputs": [
    {"id": "dH", "label": "dH (kJ/mol)", "min": -100, "max": 100, "step": 1, "initial": -58},
    {"id": "dS", "label": "dS (J/mol.K)", "min": -200, "max": 200, "step": 1, "initial": -175},
    {"id": "T", "label": "T (K)", "min": 200, "max": 500, "step": 1, "initial": 300}
  ],
  "outputs": [
    {"label": "dG (kJ/mol) = dH - T.dS/1000", "formula": "dH - (T*dS)/1000", "digits": 2}
  ],
  "caption": "Start at dH=-58, dS=-175, T=300: dG should read -5.50 kJ/mol, spontaneous. Drag T above about 331 K and dG turns positive -- the same reaction stops being spontaneous purely from a temperature rise, since dS is negative here."
}
```
