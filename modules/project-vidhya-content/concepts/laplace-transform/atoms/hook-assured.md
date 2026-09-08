---
# Alternative body for laplace-transform.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: laplace-transform.hook.assured
concept_id: laplace-transform
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: laplace-transform.hook
for_stance: assured
---

The pole is only half the snapshot: $F(s)$ standing alone, with no stated region of convergence, names two different signals at once — a causal one and an anti-causal one — since both can share the exact same algebraic expression and differ only in which side of the pole the ROC falls on. Treating that region as optional under time pressure is the actual error, not a shortcut.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "Watching $e^{-2t}$ die out is watching what the pole at $s=-2$ already encodes — the pole IS the decay rate, not a separate fact learned after inverting.", "title": "The decay $e^{-2t}$ tracing the pole at $s=-2$", "x_expr": "t", "y_expr": "exp(-2*t)", "t_min": 0, "t_max": 3, "duration_sec": 8, "narration_steps": [{"at_progress": 0.0, "text": "This is $f(t)=e^{-2t}$, starting at $(0,1)$. Predict: by $t=2$, will $f(t)$ have dropped below $0.02$, or still be above $0.1$?", "focus_point": true}, {"at_progress": 0.5, "text": "Halfway along, at $t=1.5$: $f(1.5)\\approx0.050$ — already far less than half of $1$, since decay is exponential, not linear.", "focus_point": true}, {"at_progress": 0.667, "text": "At $t=2$: $f(2)\\approx0.018$ — below $2\\%$ of the start value, confirming the prediction.", "emphasize": true, "focus_point": true}, {"at_progress": 0.78, "text": "The pole at $s=-2$ in $F(s)=\\dfrac{1}{s+2}$ IS this decay rate: one number encodes how fast the whole curve dies out."}, {"at_progress": 0.9, "text": "Students flip the sign, reading the pole at $s=-2$ as though it produced $e^{2t}$ (growth) instead of $e^{-2t}$ (decay).", "trap": {"text": "Students flip the sign, reading the pole at $s=-2$ as though it produced $e^{2t}$ (growth) instead of $e^{-2t}$ (decay).", "avoid": "The pole sits at $s=-a$ for $f(t)=e^{-at}$ — the pole's own sign already IS the decay rate's sign; don't re-negate it converting between $s$ and $t$."}}, {"at_progress": 1.0, "text": "By $t=3$: $f(3)\\approx0.0025$ — visually flat against the axis now, matching one single pole doing all the work.", "focus_point": true}]}
```
