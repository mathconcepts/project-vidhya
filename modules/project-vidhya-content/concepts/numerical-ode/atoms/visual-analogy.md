---
id: numerical-ode.visual-analogy
concept_id: numerical-ode
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
modality: visual
---

Picture standing on a mountainside in dense fog, feeling only the slope directly beneath your feet — that's the derivative $f(t,y)$ at the current point. Take a small step downhill along that slope, reassess, repeat: the update $y_{n+1}=y_n+h\,f(t_n,y_n)$ is exactly this feel-and-step process, one step at a time, with the true path never actually visible.

```gif-scene
{"type": "function-trace", "expression": "exp(-2*x)", "x_range": [0, 1], "y_range": [0, 1.1]}
```

The smooth curve on this card, $y=e^{-2t}$, is the true path down the mountainside for $y'=-2y$, $y(0)=1$ — it's what Euler's method is trying to trace using only straight-line steps, each one committing fully to the slope felt at its starting point rather than following the curve's actual bend.
