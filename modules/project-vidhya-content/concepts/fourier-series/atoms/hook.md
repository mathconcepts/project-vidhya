---
id: fourier-series.hook
concept_id: fourier-series
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

Any periodic signal—a square wave, a sawtooth, a repeating musical note—can be reconstructed as an infinite sum of sine and cosine waves at different frequencies. The Fourier series is the ultimate decomposition tool: it breaks a complex periodic waveform into its harmonic building blocks, each oscillating at an integer multiple of the fundamental frequency.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "Only three sine waves already build a flat plateau and a sharp fall — proof that a sum of smooth waves can approximate a jump, which is the entire point of a Fourier series.", "title": "Three sine terms already sketching a square wave", "x_expr": "t", "y_expr": "sin(t) + sin(3*t)/3 + sin(5*t)/5", "t_min": 0, "t_max": 3.14159265, "duration_sec": 8, "narration_steps": [{"at_progress": 0.0, "text": "Three sine waves are about to add together. Predict: will the running sum look like three separate wiggles, or start looking like one flat-topped shape?"}, {"at_progress": 0.1667, "text": "By $t=\\pi/6$ the sum has already climbed to about $0.93$ — a small overshoot right before the flat stretch, not a fourth wiggle.", "focus_point": true}, {"at_progress": 0.5, "text": "At $t=\\pi/2$ the sum sits at about $0.87$ — level across a wide stretch, the flat top predicted, built from three ordinary sine waves that individually look nothing like this.", "emphasize": true, "focus_point": true}, {"at_progress": 0.7, "text": "Each harmonic only LOOKS flat where the others' ripples happen to cancel — no single term is flat anywhere; the flatness is entirely a property of the sum."}, {"at_progress": 0.9, "text": "Students expect one of the three sine terms itself to look square-ish, hunting for a 'main' wiggle that resembles the flat top.", "trap": {"text": "Students expect one of the three sine terms itself to look square-ish, hunting for a 'main' wiggle that resembles the flat top.", "avoid": "None of $\\sin t$, $\\tfrac13\\sin3t$, $\\tfrac15\\sin5t$ is flat anywhere alone — only their SUM is; adding a term changes the shape everywhere, not just near the corners."}}, {"at_progress": 1.0, "text": "By $t=\\pi$ the sum has fallen all the way to $0$ — the jump the square wave makes, already visible with just three terms.", "focus_point": true}]}
```
