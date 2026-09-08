---
id: joint-distributions.hook
concept_id: joint-distributions
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

A student's exam performance depends on two factors: study hours and sleep quality. Both vary randomly, and we want to understand how they vary **together**. A joint distribution describes the simultaneous behavior of two or more random variables.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "Zero correlation is not independence: Y = X^2", "x_expr": "t", "y_expr": "pow(t,2)", "t_min": -2, "t_max": 2, "duration_sec": 8, "why": "A quadratic $Y=X^2$ with $X$ symmetric about $0$ has zero correlation (the linear term cancels) but total dependence — proof that $\\rho=0$ never implies independence, only that no LINEAR relationship exists.", "view_box": {"x_min": -2.5, "x_max": 2.5, "y_min": -0.3, "y_max": 4.5}, "narration_steps": [{"at_progress": 0.0, "text": "X is spread symmetrically over $[-2,2]$; $Y=X^2$ traces this curve. At $x=-2$: $y=4$. As the curve sweeps to $x=2$, will the correlation $\\rho(X,Y)$ come out positive, negative, or exactly $0$?", "focus_point": true}, {"at_progress": 0.25, "text": "At $x=-1$: $y=1$. Notice the mirror point at $x=+1$ will give the SAME $y=1$ — symmetric $x$'s produce equal $y$'s.", "focus_point": true}, {"at_progress": 0.5, "text": "At $x=0$ (the mean of $X$): $y=0$, the curve's lowest point.", "focus_point": true}, {"at_progress": 0.75, "text": "At $x=+1$: $y=1$ too — matching $x=-1$'s value. Every positive $x$ pairs with an equal-height negative $x$, so $E[XY]=E[X^3]=0$ by symmetry: $\\rho(X,Y)=0$.", "emphasize": true, "focus_point": true}, {"at_progress": 0.95, "text": "So $\\rho(X,Y)=0$ even though $Y$ is a totally deterministic function of $X$ — knowing $X$ tells you $Y$ exactly. Zero correlation does not mean independent.", "trap": {"text": "Students see $\\rho(X,Y)=0$ and conclude $X$ and $Y$ are independent.", "avoid": "Check whether $Y$ is a deterministic function of $X$ first — a quadratic relationship can still yield exactly zero LINEAR correlation. Independence needs the joint density to factor at every point, a stronger condition entirely."}}]}
```
