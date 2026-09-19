---
id: inverse-trigonometric.intuition
concept_id: inverse-trigonometric
atom_type: intuition
bloom_level: 2
difficulty: 0.0
exam_ids: ["*"]
---

Think of $\tan^{-1}$ as a ruler that only ever reports angles in one narrow window, from just above $-90°$ to just below $90°$. However far around the full circle the "real" angle actually sits, $\tan^{-1}$ folds the answer back into that one window before handing it to you — the same way a compass needle only ever points one way, never telling you it has gone all the way around twice.

That is exactly why every OTHER inverse trig function gets its own separate window too, called its principal value branch. $\sin^{-1}$ reports only angles between $-90°$ and $90°$. $\cos^{-1}$ reports only angles between $0°$ and $180°$ — a different window, because cosine and sine repeat differently.

The addition formula for $\tan^{-1}x+\tan^{-1}y$ runs into trouble for exactly this reason: the TRUE sum of two angles can walk outside $\tan^{-1}$'s narrow window even when each individual angle sits comfortably inside it. When that happens, the ruler reports a reading a half-turn away from where the sum actually is, and you must add that half-turn, $\pi$, back by hand — the formula's condition, $xy<1$, is simply the test for whether the sum has wandered outside the window at all.
