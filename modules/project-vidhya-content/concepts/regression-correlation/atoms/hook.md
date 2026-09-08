---
id: regression-correlation.hook
concept_id: regression-correlation
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
---

You observe that as study hours increase, exam scores tend to increase — but not perfectly. Correlation measures the strength of this linear relationship. Regression finds the best-fit line through the data, allowing you to predict exam scores from study hours.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "The best-fit line is close, not exact", "x_expr": "t", "y_expr": "54+5*t", "t_min": 1, "t_max": 7, "duration_sec": 8, "why": "A least-squares line minimizes the TOTAL squared vertical miss across all points — it is not required to pass through any single data point exactly, only through the mean point.", "view_box": {"x_min": 0.5, "x_max": 7.5, "y_min": 58, "y_max": 90}, "narration_steps": [{"at_progress": 0.0, "text": "This line is the least-squares fit through the hook's three points: $(2,65),(4,72),(6,85)$. Will it pass exactly through all three points, or only close to them?"}, {"at_progress": 0.1667, "text": "At $x=2$, the fitted line gives $\\hat y=64$ — the actual score was $65$, a miss of just $+1$.", "focus_point": true}, {"at_progress": 0.5, "text": "At $x=4$, the fitted line gives $\\hat y=74$ — but the actual score was $72$, a miss of $-2$, the largest of the three.", "emphasize": true, "focus_point": true}, {"at_progress": 0.8333, "text": "At $x=6$: $\\hat y=84$ vs actual $85$ (miss $+1$). Squaring these three misses ($1^2+(-2)^2+1^2=6$) is exactly what least squares minimizes — no other line through this cloud gives a smaller total.", "focus_point": true}, {"at_progress": 0.95, "text": "The fit is close, not exact — $R^2\\approx0.97$ says 97% of the scatter lines up, not 100%.", "trap": {"text": "Students expect a 'best fit' line to pass exactly through every plotted point.", "avoid": "Least squares guarantees the smallest total squared miss and passing through $(\\bar x,\\bar y)=(4,74)$ — not zero miss at any individual point unless all points are already collinear."}}]}
```
