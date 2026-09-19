---
id: semiconductor-electronics.mnemonic
concept_id: semiconductor-electronics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"p to plus, forward flows."** In forward bias, the **p**-side connects to the higher (**p**lus) potential — this one pairing tells you which way current flows without redrawing the whole circuit.

**"n for negative carrier, p for positive-acting carrier."** n-type's majority carrier is the electron (negative charge); p-type's majority carrier is the hole (acts like moving positive charge) — the letter already names the sign of whatever is doing the conducting.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the band gap — watch the maximum detectable wavelength update",
  "why": "The cutoff wavelength is just 1240 divided by the band gap — drag the slider and watch how a smaller gap reaches a longer wavelength, for any material, not only silicon and germanium above.",
  "inputs": [
    {"id": "Eg", "label": "band gap Eg (eV)", "min": 0.3, "max": 3, "step": 0.1, "initial": 1.1}
  ],
  "outputs": [
    {"label": "Maximum wavelength = 1240 / Eg (nm)", "formula": "1240/Eg", "digits": 0}
  ],
  "caption": "Start at Eg=1.1 eV (silicon): about 1127 nm, matching the worked example. Drag Eg down toward germanium's 0.7 eV and watch the wavelength grow past 1700 nm — a smaller gap always reaches further into the infrared, never a shorter distance."
}
```
