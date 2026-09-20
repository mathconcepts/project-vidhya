---
id: rotational-mechanics.mnemonic
concept_id: rotational-mechanics
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Parallel axis only ever adds — moving away from the centre never makes spinning easier."** $I=I_{cm}+Md^2$: the $Md^2$ term is always positive, so $I$ can only grow as the axis moves away from the centre of mass, never shrink.

**Rolling reminder: "Rolls without slipping, write $v=\omega R$; anything else, keep them separate."** The instant a question mentions skidding, sliding, or a spinning wheel with a fixed centre, that link between $v$ and $\omega$ is gone — treat them as two independent unknowns instead.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag Icm, mass and distance — watch the parallel axis theorem build the new moment of inertia",
  "why": "Moving the spin axis away from the centre of mass always makes a body harder to spin, by exactly Md^2 — drag the sliders and watch I only ever grow, never shrink.",
  "inputs": [
    {"id": "Icm", "label": "I_cm about the centre-of-mass axis (kg·m^2)", "min": 0.1, "max": 10, "step": 0.1, "initial": 2},
    {"id": "M", "label": "mass M (kg)", "min": 1, "max": 10, "step": 0.5, "initial": 5},
    {"id": "d", "label": "distance d to the new parallel axis (m)", "min": 0, "max": 2, "step": 0.1, "initial": 0.5}
  ],
  "outputs": [
    {"label": "Added term M*d^2 (kg·m^2)", "formula": "M*d^2", "digits": 2},
    {"label": "New moment of inertia I = Icm + M*d^2 (kg·m^2)", "formula": "Icm + M*d^2", "digits": 2}
  ],
  "caption": "Start at Icm=2, M=5, d=0.5: added term = 5*0.25 = 1.25, so I = 2 + 1.25 = 3.25 kg·m^2 — drag d to 0 and I drops back to exactly Icm, since the two axes then coincide."
}
```

