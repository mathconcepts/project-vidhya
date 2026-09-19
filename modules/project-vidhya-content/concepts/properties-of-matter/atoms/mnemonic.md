---
id: properties-of-matter.mnemonic
concept_id: properties-of-matter
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"One surface, one 2T/r; two surfaces, double it."** A liquid drop has one surface, so $\Delta P=2T/r$. A soap bubble has two (inner and outer), so $\Delta P=4T/r$ — literally twice the drop's formula, nothing new to memorise.

**"Wets the tube, climbs the tube."** Water wets glass and climbs (contact angle under $90°$, $\cos\theta>0$); mercury doesn't wet glass and gets pushed down instead (contact angle over $90°$, $\cos\theta<0$). "Wets" and "rises" go together; "doesn't wet" and "falls" go together.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag surface tension and radius — watch excess pressure double from drop to bubble",
  "why": "A soap bubble's two surfaces mean its excess pressure is always exactly double a plain drop's, for the same tension and radius -- drag either slider and the 2x relationship never breaks.",
  "inputs": [
    {"id": "T", "label": "surface tension T (N/m, water-like is about 0.03-0.07)", "min": 0.01, "max": 0.1, "step": 0.005, "initial": 0.03},
    {"id": "r", "label": "radius r (mm)", "min": 0.5, "max": 5, "step": 0.5, "initial": 2}
  ],
  "outputs": [
    {"label": "Excess pressure inside a drop = 2T/r (Pa)", "formula": "2*T/(r/1000)", "digits": 2},
    {"label": "Excess pressure inside a soap bubble = 4T/r (Pa)", "formula": "4*T/(r/1000)", "digits": 2}
  ],
  "caption": "Start at T=0.03, r=2mm: drop excess pressure = 30 Pa, bubble excess pressure = 60 Pa -- exactly double, for any T and r you drag to."
}
```

