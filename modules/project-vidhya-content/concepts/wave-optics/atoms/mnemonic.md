---
id: wave-optics.mnemonic
concept_id: wave-optics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"Whole number, glow. Half number, no."** Path difference a whole number of wavelengths: bright. Path difference a half-integer number of wavelengths: dark. Nothing in between counts as either.

**"Width dims it, gap lights it."** Single-slit **width** $a$ in $a\sin\theta=n\lambda$ marks dark bands. Double-slit **gap** (separation) $d$ in $d\sin\theta=n\lambda$ marks bright ones.

**"Denser bounce, half a dance."** A reflection off a boundary into a denser medium adds an extra half-wavelength to the path — remember it as the wave "dancing" an extra half-step only when bouncing into something denser.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag d, D, wavelength, and y -- watch the path difference update live",
  "why": "Path difference in nanometres, and how many wavelengths it amounts to, are both read straight off d, D, wavelength, and y -- drag any slider and see whether a point stays bright, goes dark, or lands on neither.",
  "inputs": [
    {"id": "d", "label": "Slit separation d (mm)", "min": 0.2, "max": 1.0, "step": 0.1, "initial": 0.5},
    {"id": "D", "label": "Screen distance D (m)", "min": 0.5, "max": 2.0, "step": 0.5, "initial": 1.0},
    {"id": "lam", "label": "Wavelength (nm)", "min": 400, "max": 700, "step": 50, "initial": 500},
    {"id": "y", "label": "Height y on screen (mm)", "min": 0, "max": 5, "step": 0.5, "initial": 2}
  ],
  "outputs": [
    {"label": "Path difference (nm) = d*y*1000/D", "formula": "(d * y * 1000) / D", "digits": 1},
    {"label": "Path difference / wavelength", "formula": "((d * y * 1000) / D) / lam", "digits": 2}
  ],
  "caption": "Start at d=0.5, D=1, wavelength=500, y=2 (this concept's worked example): path difference should read 1000 nm and the ratio should read 2 -- a whole number, so bright. Drag y down to 1.5 instead: the ratio reads 1.5 -- a half-integer, so dark."
}
```
