---
id: work-energy-power.mnemonic
concept_id: work-energy-power
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Work-energy always works; mechanical energy only works when nothing's rubbing."** The work-energy theorem ($W_{net}=\Delta KE$) holds in every situation, friction or no friction. Mechanical energy conservation needs a friction-free (or drag-free, push-free) world to hold — the moment something is "rubbing" against the motion, switch back to the work-energy theorem instead.

**Power pairing: "Force alone is not enough — speed decides the rest."** $P=Fv\cos\theta$: even a huge force gives zero power if velocity is zero, or if force and velocity point at right angles to each other (like gravity on a circling satellite).

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag mass and speeds — watch kinetic energy change and the work-energy theorem hold",
  "why": "The change in kinetic energy IS the net work done — drag any slider and watch both numbers move together, exactly, every time.",
  "inputs": [
    {"id": "m", "label": "mass m (kg)", "min": 1, "max": 10, "step": 0.5, "initial": 2},
    {"id": "u", "label": "initial speed u (m/s)", "min": 0, "max": 20, "step": 0.5, "initial": 3},
    {"id": "v", "label": "final speed v (m/s)", "min": 0, "max": 20, "step": 0.5, "initial": 5}
  ],
  "outputs": [
    {"label": "Initial KE = 0.5 * m * u^2 (J)", "formula": "0.5*m*u^2", "digits": 2},
    {"label": "Final KE = 0.5 * m * v^2 (J)", "formula": "0.5*m*v^2", "digits": 2},
    {"label": "Net work done = change in KE (J)", "formula": "0.5*m*v^2 - 0.5*m*u^2", "digits": 2}
  ],
  "caption": "Start at m=2, u=3, v=5: initial KE = 9 J, final KE = 25 J, net work = 16 J — exactly the kinetic energy gained, with no need to know what force caused it or over what distance it acted."
}
```

