---
# Alternative body for laplace-transform.worked_example, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: laplace-transform-worked-example.assured
concept_id: laplace-transform
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: laplace-transform-worked-example
for_stance: assured
---

$y''+3y'+2y=0$, $y(0)=1$, $y'(0)=0$ transforms to $(s^2+3s+2)Y=s+3$, and cover-up on $(s+1)(s+2)$ gives $A=2$, $B=-1$ directly — skip re-expanding once cover-up is automatic.

$$y(t)=2e^{-t}-e^{-2t}$$

The check worth running is on the roots, not the arithmetic: $s=-1,-2$ are both real and negative, so the system is overdamped — no oscillation belongs in the answer, and a stray $\sin$ or $\cos$ appearing here signals a factoring error in $s^2+3s+2$, not a second legitimate solution branch.

Fast check without differentiating $y(t)$ at all: $y(0)=A+B$ by construction, since every $e^{-at}$ term equals $1$ at $t=0$ — here $2+(-1)=1$, matching the given condition immediately.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: solving y'' + 3y' + 2y = 0 via Laplace transform","steps":[{"prompt":"Apply the Laplace transform to y'' + 3y' + 2y = 0 with y(0)=1 and y'(0)=0. What algebraic equation do you get for Y(s)?","hint":"Use L{y''} = s²Y − s·y(0) − y'(0) = s²Y − s, and L{y'} = sY − y(0) = sY − 1. Collect all Y(s) terms on the left.","answer":"(s² + 3s + 2)Y(s) = s + 3"},{"prompt":"Factor the denominator and decompose Y(s) = (s+3)/((s+1)(s+2)) into partial fractions A/(s+1) + B/(s+2). Find A and B.","hint":"Cover-up: set s = −1 to find A, set s = −2 to find B. A = (−1+3)/(−1+2) = 2. B = (−2+3)/(−2+1) = −1.","answer":"A = 2, B = −1; so Y(s) = 2/(s+1) − 1/(s+2)"},{"prompt":"Invert Y(s) = 2/(s+1) − 1/(s+2) to obtain y(t), and verify both initial conditions.","hint":"Use L⁻¹{1/(s+a)} = e^(−at). Check y(0) = 2·1 − 1·1 and y'(0) = 2·(−1) + 1·(−1)·(−1) ... compute y'(t) = −2e^(−t) + 2e^(−2t).","answer":"y(t) = 2e^(−t) − e^(−2t); y(0) = 2 − 1 = 1 ✓, y'(0) = −2 + 2 = 0 ✓"}]}
```
