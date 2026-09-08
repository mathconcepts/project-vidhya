---
id: laplace-applications.hook
concept_id: laplace-applications
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

An RLC circuit with a switch that flips at $t = 0$ hands you a differential equation with a discontinuous input. Attack it in the time domain and you fight the initial conditions the whole way. Transform it instead: derivatives become multiplication by $s$, the initial conditions fold in for free, and what remains is algebra.

```interactive-spec
{"v": 1, "kind": "simulation", "why": "The initial condition sets where $y(t)$ starts; the pole at $s=-3$ (real, negative) sets that it settles at $0$ — exactly what the final-value theorem predicts without inverting anything.", "title": "Solving $y'+3y=0$, $y(0)=2$ by watching $y(t)$ settle", "x_expr": "t", "y_expr": "2*exp(-3*t)", "t_min": 0, "t_max": 1.5, "duration_sec": 8, "narration_steps": [{"at_progress": 0.0, "text": "$y'+3y=0$, $y(0)=2$ transforms to $Y(s)=\\dfrac{2}{s+3}$. Predict: does $y(t)$ settle at a nonzero value as $t\\to\\infty$, or fall all the way to $0$?"}, {"at_progress": 0.222, "text": "By one time constant, $t=1/3$: $y\\approx2/e\\approx0.74$ — already well below the start value $2$.", "focus_point": true}, {"at_progress": 0.6, "text": "At $t=0.9$: $y\\approx0.134$ — the final-value theorem's prediction of $\\lim_{s\\to0}sY(s)=0$ is already visibly correct.", "emphasize": true, "focus_point": true}, {"at_progress": 0.7, "text": "The pole at $s=-3$ is real and negative — exactly the condition making the final-value theorem trustworthy: the transient genuinely dies out."}, {"at_progress": 0.8, "text": "Students transform $y'$ as $sY(s)$ alone, dropping the $-y(0)=-2$ term entirely.", "trap": {"text": "Students transform $y'$ as $sY(s)$ alone, dropping the $-y(0)=-2$ term entirely.", "avoid": "The initial condition folds in at the transform step itself: $\\mathcal{L}\\{y'\\}=sY(s)-y(0)$ — miss it and the wrong term is missing from the whole solve."}}, {"at_progress": 1.0, "text": "By $t=1.5$: $y\\approx0.022$ — visibly zero, matching the final-value theorem since the pole at $s=-3$ has no imaginary part to keep it oscillating.", "focus_point": true}]}
```
