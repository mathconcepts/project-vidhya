---
id: alternating-current.mnemonic
concept_id: alternating-current
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"ELI the ICE man."** In **ELI**, voltage ($E$) comes before current ($I$) — that spells out an inducto**L** circuit: voltage leads, current lags. In **ICE**, current ($I$) comes before voltage ($E$) — that spells out a **C**apacitor: current leads, voltage lags. Whichever letter comes first in the three-letter word is the quantity that gets there first in time.

**"Bigger $\omega$, bigger $L$-fight, smaller $C$-fight."** As frequency rises, $X_L=\omega L$ grows (an inductor fights AC harder at high frequency) while $X_C=1/(\omega C)$ shrinks (a capacitor barely fights AC at all once frequency is high enough).

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag R, X_L, X_C — watch the impedance and power factor update live",
  "why": "Impedance and power factor are both just numbers built from R, X_L, and X_C directly, with no need to solve the whole circuit again for every new value.",
  "inputs": [
    {"id": "R", "label": "Resistance R (ohm)", "min": 5, "max": 60, "step": 5, "initial": 30},
    {"id": "XL", "label": "Inductive reactance X_L (ohm)", "min": 0, "max": 80, "step": 5, "initial": 50},
    {"id": "XC", "label": "Capacitive reactance X_C (ohm)", "min": 0, "max": 80, "step": 5, "initial": 10}
  ],
  "outputs": [
    {"label": "Impedance Z = sqrt(R^2 + (X_L - X_C)^2), in ohm", "formula": "sqrt(R^2 + (XL - XC)^2)", "digits": 2},
    {"label": "Power factor cos(phi) = R / Z", "formula": "R / sqrt(R^2 + (XL - XC)^2)", "digits": 3}
  ],
  "caption": "Start at R=30, X_L=50, X_C=10 (this concept's worked example): Z should read 50 and the power factor 0.6. Now drag X_L down until it equals X_C: Z drops all the way to R itself, and the power factor rises to exactly 1 -- that instant is resonance."
}
```
