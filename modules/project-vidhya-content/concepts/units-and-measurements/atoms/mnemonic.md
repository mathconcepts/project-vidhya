---
id: units-and-measurements.mnemonic
concept_id: units-and-measurements
atom_type: mnemonic
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
modality: mnemonic
---

**"Add? Count decimals. Multiply? Count figures."** Two short questions settle every significant-figures problem. Ask which operation you are doing first — that alone tells you whether to match decimal places (addition/subtraction) or match the count of significant figures (multiplication/division).

**For errors: "Sum and difference add the numbers themselves. Product, quotient, and power add the *fractions*."** Whenever a power $n$ is involved, that fraction gets multiplied by $n$ before it is added in — a squared quantity doubles its relative error, a cubed one triples it.

**Seven base units, one per idea that cannot be built from anything smaller**: metre, kilogram, second, ampere, kelvin, mole, candela — length, mass, time, current, temperature, amount, and light, each measured on its own, never derived from the other six.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the measured length and its error — watch the volume's error propagate live",
  "why": "V = a^3 is a power of one measurement, so its relative error is always 3 times a's relative error - drag either slider to see that for any a, not just the worked example.",
  "inputs": [
    {"id": "a", "label": "a - measured side length (cm)", "min": 1, "max": 5, "step": 0.05, "initial": 2.2},
    {"id": "da", "label": "delta-a - instrument's possible error (cm)", "min": 0.01, "max": 0.1, "step": 0.01, "initial": 0.01}
  ],
  "outputs": [
    {"label": "Relative error in a (%) = (delta-a / a) x 100", "formula": "(da/a)*100", "digits": 2},
    {"label": "Volume V = a^3 (cm^3)", "formula": "a^3", "digits": 3},
    {"label": "Relative error in V (%) = 3 x relative error in a", "formula": "3*(da/a)*100", "digits": 2},
    {"label": "Absolute error in V (cm^3)", "formula": "(a^3)*3*(da/a)", "digits": 3}
  ],
  "caption": "Start at a=2.2, delta-a=0.01 (the worked example): relative error in a reads about 0.45%, V reads 10.648, relative error in V about 1.36%, absolute error in V about 0.145 - matching V=(10.6+/-0.1) cm^3 once rounded. Drag either slider and watch every number rebuild from a and delta-a alone, with no need to redo the algebra."
}
```

