---
# Alternative body for ode-first-order.hook, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-first-order.hook.assured
concept_id: ode-first-order
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: ode-first-order.hook
for_stance: assured
---

Every first-order solution carries one arbitrary constant. The mark lost under time pressure is dropping that constant before an initial condition is applied, or fixing it against the wrong branch when the solution is only implicit in $x$ and $y$.

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
