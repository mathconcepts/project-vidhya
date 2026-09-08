---
# Alternative body for fourier-series.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: fourier-series.hook.assured
concept_id: fourier-series
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: fourier-series.hook
for_stance: assured
---

The decomposition is the whole content — a period-$2L$ signal is $\dfrac{a_0}{2}+\sum a_n\cos\frac{n\pi x}{L}+b_n\sin\frac{n\pi x}{L}$, nothing more exotic. Where GATE actually scores you is elsewhere: whether you exploit even/odd symmetry to kill half the coefficients before integrating, and whether you know the series at a jump discontinuity converges to the *average* of the left and right boundary limits, not to $f$ itself.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "Only three sine waves already build a flat plateau and a sharp fall — proof that a sum of smooth waves can approximate a jump, which is the entire point of a Fourier series.", "title": "Three sine terms already sketching a square wave", "x_expr": "t", "y_expr": "sin(t) + sin(3*t)/3 + sin(5*t)/5", "t_min": 0, "t_max": 3.14159265, "duration_sec": 8, "narration_steps": [{"at_progress": 0.0, "text": "Three sine waves are about to add together. Predict: will the running sum look like three separate wiggles, or start looking like one flat-topped shape?"}, {"at_progress": 0.1667, "text": "By $t=\\pi/6$ the sum has already climbed to about $0.93$ — a small overshoot right before the flat stretch, not a fourth wiggle.", "focus_point": true}, {"at_progress": 0.5, "text": "At $t=\\pi/2$ the sum sits at about $0.87$ — level across a wide stretch, the flat top predicted, built from three ordinary sine waves that individually look nothing like this.", "emphasize": true, "focus_point": true}, {"at_progress": 0.7, "text": "Each harmonic only LOOKS flat where the others' ripples happen to cancel — no single term is flat anywhere; the flatness is entirely a property of the sum."}, {"at_progress": 0.9, "text": "Students expect one of the three sine terms itself to look square-ish, hunting for a 'main' wiggle that resembles the flat top.", "trap": {"text": "Students expect one of the three sine terms itself to look square-ish, hunting for a 'main' wiggle that resembles the flat top.", "avoid": "None of $\\sin t$, $\\tfrac13\\sin3t$, $\\tfrac15\\sin5t$ is flat anywhere alone — only their SUM is; adding a term changes the shape everywhere, not just near the corners."}}, {"at_progress": 1.0, "text": "By $t=\\pi$ the sum has fallen all the way to $0$ — the jump the square wave makes, already visible with just three terms.", "focus_point": true}]}
```
