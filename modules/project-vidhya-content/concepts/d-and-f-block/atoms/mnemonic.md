---
id: d-and-f-block.mnemonic
concept_id: d-and-f-block
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Half a house or a full house — never an awkward almost."** Chromium and copper each shift one electron from $4s$ into $3d$ to reach a half-filled or fully-filled $d$ subshell, because either "house" is more stable than the "expected", awkwardly-almost-full one.

**"Lose the roof before the walls."** When a transition metal forms a cation, the $4s$ electrons (added last, but sitting like a roof on top) leave first — always before any $3d$ electron.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the unpaired-electron count — watch the spin-only magnetic moment update live",
  "why": "Magnetic moment is just one square root away from the unpaired-electron count n, whatever ion or ligand field produced that n - drag the slider and watch the value rebuild for any n from 0 to 5.",
  "inputs": [
    {"id": "n", "label": "n (number of unpaired d electrons)", "min": 0, "max": 5, "step": 1, "initial": 4}
  ],
  "outputs": [
    {"label": "Spin-only magnetic moment (BM) = sqrt(n(n+2))", "formula": "sqrt(n*(n+2))", "digits": 2}
  ],
  "caption": "Start at n=4 (high-spin Fe2+): the moment should read 4.90 BM. Drag n down to 0 (like low-spin Fe2+ with CN- ligands, or d10 Zn2+): the moment drops to exactly 0, diamagnetic. Try n=3 (Cr3+): 3.87 BM, matching the worked example."
}
```
