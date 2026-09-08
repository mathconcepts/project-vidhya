---
# Alternative body for regression-correlation.hook, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: regression-correlation.hook.shaken
concept_id: regression-correlation
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: regression-correlation.hook
for_stance: shaken
---

Study 2 hours, score 65; study 6 hours, score 85 — more hours, higher score, but not a perfectly straight line. A student's 4 hours might give 72, not exactly 75. Correlation measures how tight that line is; regression draws it.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "The best-fit line is close, not exact", "x_expr": "t", "y_expr": "54+5*t", "t_min": 1, "t_max": 7, "duration_sec": 8, "why": "A least-squares line minimizes the TOTAL squared vertical miss across all points — it is not required to pass through any single data point exactly, only through the mean point.", "view_box": {"x_min": 0.5, "x_max": 7.5, "y_min": 58, "y_max": 90}, "narration_steps": [{"at_progress": 0.0, "text": "This line is the least-squares fit through the hook's three points: $(2,65),(4,72),(6,85)$. Will it pass exactly through all three points, or only close to them?"}, {"at_progress": 0.1667, "text": "At $x=2$, the fitted line gives $\\hat y=64$ — the actual score was $65$, a miss of just $+1$.", "focus_point": true}, {"at_progress": 0.5, "text": "At $x=4$, the fitted line gives $\\hat y=74$ — but the actual score was $72$, a miss of $-2$, the largest of the three.", "emphasize": true, "focus_point": true}, {"at_progress": 0.8333, "text": "At $x=6$: $\\hat y=84$ vs actual $85$ (miss $+1$). Squaring these three misses ($1^2+(-2)^2+1^2=6$) is exactly what least squares minimizes — no other line through this cloud gives a smaller total.", "focus_point": true}, {"at_progress": 0.95, "text": "The fit is close, not exact — $R^2\\approx0.97$ says 97% of the scatter lines up, not 100%.", "trap": {"text": "Students expect a 'best fit' line to pass exactly through every plotted point.", "avoid": "Least squares guarantees the smallest total squared miss and passing through $(\\bar x,\\bar y)=(4,74)$ — not zero miss at any individual point unless all points are already collinear."}}]}
```
