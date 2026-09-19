---
id: kinematics-2d.mnemonic
concept_id: kinematics-2d
atom_type: mnemonic
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: mnemonic
---

**"Cos goes across, sine goes skyward."** $u_x=u\cos\theta$ (the horizontal, "across" component), $u_y=u\sin\theta$ (the vertical, "skyward" component) — a quick way to check you have not swapped the two when $\theta$ is measured from the horizontal.

**"Two clocks, one stopwatch."** Horizontal motion and vertical motion run as two completely separate one-dimensional problems, but they share the exact same value of $t$ at every instant — that shared clock is the only thing linking the two axes until the final answer.

**"Centripetal points home."** In circular motion, the acceleration always points from the object straight toward the centre of the circle — like a string always pulling a swung stone back toward your hand — never forward along the path of motion.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Drag launch speed and angle - watch time of flight, height and range rebuild",
  "why": "Every projectile answer comes from resolving u into u*cos(theta) and u*sin(theta) first, then running two separate one-dimensional problems - drag either slider and watch that resolution happen live, for any speed or angle, not only the worked example's numbers.",
  "inputs": [
    {"id": "u", "label": "u - launch speed (m/s)", "min": 5, "max": 40, "step": 1, "initial": 20},
    {"id": "theta", "label": "theta - launch angle (degrees)", "min": 10, "max": 80, "step": 0.01, "initial": 36.87}
  ],
  "outputs": [
    {"label": "u_x = u cos(theta) (m/s)", "formula": "u*cos(theta*0.0174533)", "digits": 2},
    {"label": "u_y = u sin(theta) (m/s)", "formula": "u*sin(theta*0.0174533)", "digits": 2},
    {"label": "Time of flight T = 2 u_y / g, g=10 (s)", "formula": "2*(u*sin(theta*0.0174533))/10", "digits": 2},
    {"label": "Range R = u_x x T (m)", "formula": "(u*cos(theta*0.0174533))*(2*(u*sin(theta*0.0174533))/10)", "digits": 2}
  ],
  "caption": "Start at u=20, theta=36.87 degrees (sin theta=0.6, cos theta=0.8, this concept's worked example): u_x should read 16.00, u_y 12.00, T 2.40, R 38.40, matching the worked example exactly. Drag u or theta and watch all four numbers rebuild from the same two-step split, with no need to redo the algebra."
}
```

