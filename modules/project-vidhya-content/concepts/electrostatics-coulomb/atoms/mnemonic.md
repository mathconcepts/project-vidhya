---
id: electrostatics-coulomb.mnemonic
concept_id: electrostatics-coulomb
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Square the distance, then divide."** Coulomb's law and the field of a point charge both carry $r^2$ in the denominator, never a bare $r$. Say "square it first" out loud before touching the calculator, and the halve-versus-quarter mix-up stops happening.

**"Field OUT of positive, field INTO negative."** A positive charge's arrows point away from it, like water spraying outward. A negative charge's arrows point the opposite way — inward, like water draining into a hole.

**"Symmetric shape → Gauss. Odd shape → Coulomb."** Sphere, infinite sheet, long cylinder: reach for Gauss's law. Anything without one of these three shapes: go straight to Coulomb's law and add up the pieces by hand.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the charges and the distance — watch Coulomb's force update live",
  "why": "Force depends on both charges multiplied together, but on distance squared — drag r and watch the force fall much faster than dragging either charge by the same amount.",
  "inputs": [
    {"id": "q1", "label": "q1 (microcoulombs)", "min": 1, "max": 10, "step": 0.5, "initial": 2},
    {"id": "q2", "label": "q2 (microcoulombs)", "min": 1, "max": 10, "step": 0.5, "initial": 3},
    {"id": "r", "label": "r (metres)", "min": 0.5, "max": 5, "step": 0.1, "initial": 1}
  ],
  "outputs": [
    {"label": "Force between the charges (millinewtons)", "formula": "9*q1*q2/(r^2)", "digits": 2}
  ],
  "caption": "Start at q1=2, q2=3, r=1: force should read 54 mN. Double r to 2 without touching q1 or q2, and force drops to about 13.5 mN — a quarter, not a half, because r is squared in the formula."
}
```

