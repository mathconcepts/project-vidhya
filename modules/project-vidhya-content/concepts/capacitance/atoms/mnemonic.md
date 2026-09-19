---
id: capacitance.mnemonic
concept_id: capacitance
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Capacitors are the mirror image of resistors."** Whatever a resistor does in series, a capacitor does in parallel — and whatever a resistor does in parallel, a capacitor does in series. Say "mirror" before writing any combination formula, and the two never get swapped.

**"Redistribution: add up the charge, not the voltage."** When two charged capacitors are connected, write down $Q_1$ and $Q_2$ first, add (or subtract, if polarity is opposite), then divide by the total capacitance. Never average the voltages directly.

**"Battery in, energy grows with a dielectric. Battery out, energy shrinks."** The battery's presence at the moment the dielectric slides in is the one fact that flips the whole answer.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag C1 and C2 — compare series against parallel combination",
  "why": "The same two capacitors give a smaller combined value in series and a larger one in parallel — drag either slider and watch both numbers move in opposite directions from the resistor rule.",
  "inputs": [
    {"id": "C1", "label": "C1 (microfarads)", "min": 1, "max": 10, "step": 0.5, "initial": 6},
    {"id": "C2", "label": "C2 (microfarads)", "min": 1, "max": 10, "step": 0.5, "initial": 3}
  ],
  "outputs": [
    {"label": "Series combination (microfarads)", "formula": "(C1*C2)/(C1+C2)", "digits": 2},
    {"label": "Parallel combination (microfarads)", "formula": "C1+C2", "digits": 2}
  ],
  "caption": "Start at C1=6, C2=3: series should read 2.00 (smaller than either one) and parallel should read 9.00 (bigger than either one). Drag either slider and the series value always stays below the smaller of the two, while the parallel value always stays above the larger one."
}
```

