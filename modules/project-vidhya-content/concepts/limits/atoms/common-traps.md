---
id: limits.common_traps
concept_id: limits
atom_type: common_traps
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
tested_by_atom: limits.micro-exercise
---

**Trap 1 — Applying L'Hôpital's rule without checking the form first.** The rule only fires on $\frac00$ or $\frac{\infty}{\infty}$. Differentiating top and bottom of an already-determinate fraction gives a number, but not the right one — the rule was never licensed to apply there.

**Trap 2 — Stopping after one application while still indeterminate.** $\lim_{x\to0}\frac{1-\cos x}{x^2}$ becomes $\frac{\sin x}{2x}$ after one pass — which is *still* $\frac00$ at $x=0$. Reading off an answer without re-checking the form after every single application is the most common way this problem is lost.

**Trap 3 — Eyeballing one-sided limits instead of computing them.** Two branches of a piecewise function can look identical near a join point on a rough sketch and still differ by a fraction that matters — compute both one-sided limits algebraically before concluding they agree.
