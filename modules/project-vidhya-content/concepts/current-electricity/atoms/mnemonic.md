---
id: current-electricity.mnemonic
concept_id: current-electricity
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Walk once, sign once."** Pick a walking direction around a loop and stick with it for that whole equation — never re-decide a sign halfway through.

**"With the flow, you fall. Against it, you rise."** Crossing a resistor the way the current is assumed to go is always a drop; crossing it backwards is always a rise. The same "with/against" logic applies to a cell's $-$-to-$+$ or $+$-to-$-$ crossing.

**"Emf is the promise. Terminal voltage is the delivery."** A cell's emf is what it promises with nothing else in the way; terminal voltage is what actually shows up once current is flowing and internal resistance has taken its cut.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag emf, current, and internal resistance — watch terminal voltage move",
  "why": "Terminal voltage is never just the emf once current flows — drag any slider and see exactly how much of the emf the cell's own internal resistance eats up.",
  "inputs": [
    {"id": "E", "label": "emf (volts)", "min": 1, "max": 12, "step": 0.5, "initial": 6},
    {"id": "I", "label": "current (amps)", "min": 0.1, "max": 2, "step": 0.1, "initial": 1},
    {"id": "r", "label": "internal resistance (ohms)", "min": 0.1, "max": 2, "step": 0.1, "initial": 0.5}
  ],
  "outputs": [
    {"label": "Terminal voltage while discharging (volts)", "formula": "E - I*r", "digits": 2}
  ],
  "caption": "Start at emf=6, I=1, r=0.5: terminal voltage should read 5.50 V, less than the 6 V emf. Push current or internal resistance up, and the gap between emf and terminal voltage grows wider."
}
```

