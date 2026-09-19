---
id: electromagnetic-induction.mnemonic
concept_id: electromagnetic-induction
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"Faraday counts how much, Lenz decides which way."** Faraday's law ($\varepsilon = -N\,d\Phi/dt$) only tells you the *size* of the induced emf. Lenz's law is a separate, second step that fixes the *direction* — always run both, never assume the direction is "obvious" from the field alone.

**"It's the change, not the chart."** Whatever value the field or flux currently reads on an imaginary chart is irrelevant to direction — only whether that reading is climbing or falling matters. Falling reading, current reinforces; climbing reading, current opposes.

**"L for alone, M for mate."** Self-inductance $L$ is a coil reacting to *its own* changing current. Mutual inductance $M$ is a coil reacting to its *neighbour's* changing current. Same formula shape, $\varepsilon = -(\text{something})\,dI/dt$, different source of the changing current.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the field values and the time — watch the induced emf update live",
  "why": "The induced emf depends only on the coil's area and how fast the field is changing, never on the field's own size at any one instant — drag the sliders and see the emf rebuild from scratch every time.",
  "inputs": [
    {"id": "A", "label": "Coil area (m^2)", "min": 0.01, "max": 0.05, "step": 0.005, "initial": 0.02},
    {"id": "Bi", "label": "Starting field (T)", "min": 0, "max": 1, "step": 0.05, "initial": 0.6},
    {"id": "Bf", "label": "Ending field (T)", "min": 0, "max": 1, "step": 0.05, "initial": 0.2},
    {"id": "t", "label": "Time taken (s)", "min": 0.1, "max": 2, "step": 0.1, "initial": 0.4}
  ],
  "outputs": [
    {"label": "Rate of change dB/dt (T/s)", "formula": "(Bf - Bi) / t", "digits": 2},
    {"label": "Magnitude of induced emf = A x |dB/dt| (V)", "formula": "abs(A * (Bf - Bi) / t)", "digits": 3}
  ],
  "caption": "Start at A=0.02, Bi=0.6, Bf=0.2, t=0.4 (the fading-field case from the hook): emf should read 0.02 V. Set Bf higher than Bi instead, and watch the emf stay exactly the same size for the same size of change — only the direction of the change flips, not the size of the effect."
}
```
