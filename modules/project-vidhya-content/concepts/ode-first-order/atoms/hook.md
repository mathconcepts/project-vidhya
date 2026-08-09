---
id: ode-first-order.hook
concept_id: ode-first-order
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

Imagine water draining from a tank — the rate at which it drains depends on how much water is left. A first-order ODE captures this "how it changes depends on what it is" relationship in one equation.

```interactive-spec
{
  "v": 1,
  "kind": "manipulable",
  "title": "Draining tank: V(t) = V₀ · e^(−kt)",
  "inputs": [
    {"id": "k", "label": "Drain rate k (per second)", "min": 0.1, "max": 2.0, "step": 0.1, "initial": 0.5},
    {"id": "V0", "label": "Initial volume V₀ (litres)", "min": 1, "max": 10, "step": 0.5, "initial": 5}
  ],
  "outputs": [
    {"label": "Volume at t = 1 s  (L)", "formula": "V0 * exp(-k * 1)", "digits": 2},
    {"label": "Volume at t = 3 s  (L)", "formula": "V0 * exp(-k * 3)", "digits": 2},
    {"label": "Volume at t = 5 s  (L)", "formula": "V0 * exp(-k * 5)", "digits": 2},
    {"label": "Half-life  (s)", "formula": "log(2) / k", "digits": 2}
  ],
  "caption": "V(t) = V₀ e^(−kt) solves dV/dt = −kV. Raise k and watch the tank empty faster; the half-life halves every time k doubles."
}
```
