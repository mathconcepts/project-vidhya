---
id: magnetic-effects.mnemonic
concept_id: magnetic-effects
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Along it, nothing. Across it, everything."** Moving *along* the field gives zero force. Moving *across* it (perpendicular) gives the maximum possible force. Everything in between grows smoothly as $\sin\theta$.

**"Right hand for a lone charge, left hand for a wire."** A single moving charge's force direction: right-hand rule. A current-carrying wire or coil's force (or torque): Fleming's Left-Hand Rule. Different setups, different hands — and always flip the right-hand result for a negative charge.

**"Torque cares about the normal, not the plane."** In $\tau=NIAB\sin\theta$, picture the loop's normal (an arrow poking straight out of its face) — $\theta$ is measured from *that* arrow to $\vec B$, never from the flat plane of the loop itself.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag the angle between v and B — watch the force rise and fall",
  "why": "Force on a moving charge depends on the angle between its velocity and the field, not just their sizes — drag the angle to zero and watch the force vanish completely, even with charge, speed, and field all held fixed.",
  "inputs": [
    {"id": "q", "label": "charge (microcoulombs)", "min": 1, "max": 10, "step": 0.5, "initial": 5},
    {"id": "v", "label": "speed (km/s)", "min": 1, "max": 10, "step": 0.5, "initial": 2},
    {"id": "B", "label": "field (millitesla)", "min": 1, "max": 10, "step": 0.5, "initial": 5},
    {"id": "theta", "label": "angle between v and B (degrees)", "min": 0, "max": 90, "step": 1, "initial": 30}
  ],
  "outputs": [
    {"label": "Force magnitude (micronewtons)", "formula": "q*v*B*sin(theta*0.0174533)", "digits": 2}
  ],
  "caption": "Start at theta=30 degrees: force should read about 25.00. Drag the angle down to 0 (velocity parallel to field) and the force drops all the way to 0, however large q, v, or B are set. Drag it up to 90 and the force reaches its largest possible value for those settings."
}
```

