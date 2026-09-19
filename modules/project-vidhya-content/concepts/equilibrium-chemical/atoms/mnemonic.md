---
id: equilibrium-chemical.mnemonic
concept_id: equilibrium-chemical
atom_type: mnemonic
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: mnemonic
---

**"Q chases K, never the other way round."** $Q$ is wherever the system happens to be right now; $K$ is the fixed destination. The reaction always moves $Q$ toward $K$, never $K$ toward $Q$.

**"Catalyst: faster trip, same destination."** A catalyst shortens the *time* to reach equilibrium; it never moves *where* that equilibrium sits.

**"Le Chatelier predicts, rates explain."** Le Chatelier's rule says which way a stressed equilibrium moves; the actual reason is the forward and reverse rates changing by different amounts.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag [A] and [B] — watch Q update and compare it to Kc=4.0",
  "why": "The reaction quotient Q is just the ratio of current concentrations, using the same expression as Kc -- drag either slider and watch Q rebuild instantly, for any pair of concentrations, not only the example above.",
  "inputs": [
    {"id": "A", "label": "[A] (M)", "min": 0.1, "max": 5, "step": 0.1, "initial": 2},
    {"id": "B", "label": "[B] (M)", "min": 0.1, "max": 5, "step": 0.1, "initial": 3}
  ],
  "outputs": [
    {"label": "Q = [B] / [A]", "formula": "B/A", "digits": 2},
    {"label": "Q minus Kc (Kc = 4.0)", "formula": "(B/A) - 4", "digits": 2}
  ],
  "caption": "Start at [A]=2, [B]=3: Q should read 1.50, and Q-Kc reads -2.50 (negative, so Q<Kc: the reaction still runs forward). Drag [B] up until Q-Kc reads 0.00 -- that is exactly where this system reaches equilibrium."
}
```
