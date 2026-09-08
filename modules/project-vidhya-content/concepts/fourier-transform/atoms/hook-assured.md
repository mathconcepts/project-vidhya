---
# Alternative body for fourier-transform.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: fourier-transform.hook.assured
concept_id: fourier-transform
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: fourier-transform.hook
for_stance: assured
---

Continuous spectrum in place of discrete harmonics is the whole story; the trap sits in the shift theorems. A time shift $f(t-t_0)$ multiplies $F(\omega)$ by $e^{-i\omega t_0}$ — the phase term goes with the *time* variable, so it is easy under pressure to write $e^{+i\omega t_0}$ instead, or to attach it to the frequency shift $F(\omega-\omega_0)$ formula in reverse, swapping which one gets the sign.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "The same decay that keeps this clap's total energy finite also makes its frequency content fade at high $\\omega$ — one number, the decay rate, governs both facts at once.", "title": "A hand-clap $e^{-t}$: finite energy, fading spectrum", "x_expr": "t", "y_expr": "exp(-t)", "t_min": 0, "t_max": 4, "duration_sec": 8, "narration_steps": [{"at_progress": 0.0, "text": "A clap decays as $e^{-t}$ for $t\\ge0$. Predict: does the area under this curve out to $t\\to\\infty$ stay finite, or grow without bound?"}, {"at_progress": 0.25, "text": "At $t=1$: $f(1)\\approx0.368$ — already down to about a third of the start value $1$.", "focus_point": true}, {"at_progress": 0.5, "text": "$F(0)=\\displaystyle\\int_0^\\infty e^{-t}\\,dt=1$ — the DC value equals the transform's own value at $\\omega=0$: a finite total even though the curve never quite touches $0$.", "emphasize": true}, {"at_progress": 0.75, "text": "The same decay rate that keeps this area finite also makes $|F(\\omega)|=\\dfrac{1}{\\sqrt{1+\\omega^2}}$ shrink toward $0$ as $|\\omega|$ grows — a clap this short carries almost none of its energy at very high frequency."}, {"at_progress": 0.875, "text": "Students confuse this one-sided decay with the bilateral (two-sided) $e^{-|t|}$, and reach for the real-valued pair $\\dfrac{2a}{a^2+\\omega^2}$ instead of the correct one-sided $\\dfrac{1}{a+i\\omega}$.", "trap": {"text": "Students confuse this one-sided decay with the bilateral (two-sided) $e^{-|t|}$, and reach for the real-valued pair $\\dfrac{2a}{a^2+\\omega^2}$ instead of the correct one-sided $\\dfrac{1}{a+i\\omega}$.", "avoid": "This trace is $0$ for $t<0$ — one-sided. The bilateral $e^{-|t|}$ is a different, even function with a different (real) transform; check which side of $t=0$ the curve actually lives on first."}}, {"at_progress": 1.0, "text": "By $t=4$: $f(4)\\approx0.018$ — visually gone, matching a one-sided signal whose transform, $\\dfrac{1}{1+i\\omega}$, has no imaginary-axis poles keeping it alive forever.", "focus_point": true}]}
```
