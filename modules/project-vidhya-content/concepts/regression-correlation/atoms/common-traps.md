---
id: regression-correlation.common-traps
concept_id: regression-correlation
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing correlation with regression**: Correlation ($r$) is symmetric and measures association; regression (slope $b$) is directional and predicts $Y$ from $X$. Computing $r$ when asked for the regression slope (or vice versa) is a category error.
- **Forgetting that $R^2 = r^2$, not $R^2 = r$**: Students sometimes report $R^2 = 0.8$ when $r = 0.8$, which is wrong. The squared relationship is fundamental: $R^2 = r^2$.
- **Misinterpreting slope causation**: A strong regression slope does NOT imply causation. Correlation and regression describe association only. GATE occasionally tests this conceptual point via "does this regression prove that X causes Y?" type questions (answer: no, not without additional experimental design).
