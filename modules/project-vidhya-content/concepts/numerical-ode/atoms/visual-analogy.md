---
id: numerical-ode.visual-analogy
concept_id: numerical-ode
atom_type: visual_analogy
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
scaffold_fade: true
---

## The Foggy Mountain Analogy

Imagine standing on a mountainside in dense fog. You cannot see the path ahead, but you *can* feel the slope directly beneath your feet. Your strategy: take a small step downhill in the direction of that slope, then reassess. Repeat thousands of times, and you descend the mountain.

The **fog** represents our ignorance of the full solution curve. The **slope you feel** is the derivative $f(t, y)$ at your current location. Each **step forward** is the update $y_{n+1} = y_n + h \cdot f(t_n, y_n)$.

Just as:
- Smaller steps let you follow the curve more faithfully (but take longer)
- A steeper slope sends you down faster
- Sudden slope changes (high curvature) can mislead you if your steps are too large

…so numerical solvers must balance **step size** against **accuracy** and **computational cost**.

### Visualization: Solution Decay with Damping

Below, watch how a damped oscillation evolves—like a ball bouncing on a floor with friction, losing energy with each bounce. A numerical solver approximates this curve by stepping along it.

```gif-scene
{"type":"parametric","expression":"exp(-t/5)*sin(2*pi*t)","x_range":[0,1],"y_range":[-1.2,1.2],"t_range":[0,5],"frames":30,"fps":12}
```

The smooth decay you see is what the solver is trying to approximate: using the current slope to predict the next point, one step at a time.
