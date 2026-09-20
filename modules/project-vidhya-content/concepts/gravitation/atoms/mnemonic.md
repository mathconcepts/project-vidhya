---
id: gravitation.mnemonic
concept_id: gravitation
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Escaping costs root-two times as much as circling forever."** $v_e = \sqrt{2}\,v_{orbital}$ at the same radius — remember the $\sqrt2$, not $2$, since energy (which scales as $v^2$) is what actually doubles, not speed itself.

**"GM equals g R squared — swap whichever pair the question didn't give you."** If a question gives $g$ and $R$, never go looking for $G$ and $M$ separately; the substitution $GM=gR^2$ does the whole job in one line.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag planet mass and orbit radius — watch orbital and escape speed update live",
  "why": "Orbital and escape speed both come from GM and r alone -- drag either slider and watch escape speed stay exactly root-two times orbital speed, every time, for any planet and any radius.",
  "inputs": [
    {"id": "M", "label": "planet mass M (in units of 10^24 kg; Earth is about 6)", "min": 1, "max": 20, "step": 0.5, "initial": 6},
    {"id": "r", "label": "orbit radius r (in units of 10^6 m; Earth's radius is about 6.4)", "min": 1, "max": 50, "step": 0.5, "initial": 7}
  ],
  "outputs": [
    {"label": "Orbital speed v = sqrt(GM/r) (km/s)", "formula": "sqrt(66740000*M/r)/1000", "digits": 2},
    {"label": "Escape speed v_e = sqrt(2GM/r) (km/s)", "formula": "sqrt(133480000*M/r)/1000", "digits": 2}
  ],
  "caption": "Start at M=6, r=7 (close to Earth's own numbers): orbital speed comes out about 7.56 km/s, escape speed about 10.70 km/s -- their ratio is exactly root-two (about 1.414), no matter what M and r are dragged to."
}
```

