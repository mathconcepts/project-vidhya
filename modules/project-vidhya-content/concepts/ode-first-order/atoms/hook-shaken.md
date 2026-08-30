---
# Alternative body for ode-first-order.hook, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: ode-first-order.hook.shaken
concept_id: ode-first-order
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: ode-first-order.hook
for_stance: shaken
---

A tank starts with $5$ litres and drains at rate $0.5$ per second: $\dfrac{dV}{dt} = -0.5V$. Right now, how fast it drains depends only on how much is left right now — that's the whole idea.

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
