---
# Alternative body for root-finding.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: root-finding.hook.assured
concept_id: root-finding
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: root-finding.hook
for_stance: assured
---

Every root-finding method here trades away a guarantee for speed, and GATE tests exactly that trade. Bisection converges whenever $f(a)f(b)<0$, at a fixed linear rate, using only the sign of $f$ — slow, but it cannot fail. Newton-Raphson converges quadratically near a *simple* root with $f'$ bounded away from zero, but a repeated root, a poor starting guess, or a near-zero $f'$ can make it stall, oscillate, or diverge outright. The secant method needs no derivative but only reaches superlinear order ($\approx1.618$), and it needs two starting values, not one. Knowing which guarantee a question is quietly assuming is worth more marks than reciting any single formula.

```interactive-spec
{"v":1,"kind":"simulation","title":"Watching f(x)=x^3-x-1 collapse toward zero, one tangent line at a time","why":"Traces the same cubic from the hook as x runs from the first guess down to the root, showing why each tangent-line correction closes the gap so much faster than a straight halving would.","x_expr":"1.5 - 0.1752820427552102*t","y_expr":"(1.5 - 0.1752820427552102*t)*(1.5 - 0.1752820427552102*t)*(1.5 - 0.1752820427552102*t) - (1.5 - 0.1752820427552102*t) - 1","t_min":0,"t_max":1,"duration_sec":8,"narration_steps":[{"at_progress":0.0,"text":"$f(1.5)=0.875$ — a real gap above zero. Follow the tangent line at $x=1.5$ down to where IT crosses zero: does that landing spot cut the gap in HALF, or by much more than half?","text_shaken":"$f(1.5)=0.875$. Slide down the tangent line at $x=1.5$ to where it hits zero — will the new gap be half the old one, or smaller still?","text_assured":"$f(1.5)=0.875$. Predict the order of the next correction before it lands: does Newton merely halve the error here, or square it?"},{"at_progress":0.86816601775914,"focus_point":true,"text":"One tangent-line correction lands at $x=1.3478$, where $f(1.3478)\\approx0.1007$ — the height dropped from $0.875$ to about $0.1007$, roughly an $8.7\\times$ shrink, not a $2\\times$ one.","text_shaken":"Correction lands at $x=1.3478$: $f(1.3478)\\approx0.1007$. Height went from $0.875$ down to $0.1007$ — about $8.7\\times$ smaller, not just half.","text_assured":"$x_1=1.3478$, $f(x_1)\\approx0.1007$ — an $8.7\\times$ drop in height for one correction, well past what a simple halving would give."},{"at_progress":0.92,"text":"The error keeps shrinking fast here, but that speed is not automatic for every starting guess or every function.","text_shaken":"The error is shrinking fast — but this speed isn't guaranteed for every function or every starting guess.","text_assured":"Quadratic convergence assumed a simple root and $f'$ bounded away from $0$ near it — both true here, but neither is automatic.","trap":{"text":"Students expect this rapid shrink to continue no matter what — but quadratic convergence needs $f'$ to stay well away from zero near the root.","avoid":"Check that $f'$ at the current guess isn't close to zero before trusting that the next correction lands closer, not farther, from the root."}},{"at_progress":0.99724762617702,"focus_point":true,"emphasize":true,"text":"$x_2\\approx1.3252$, $f(x_2)\\approx0.00206$ — the height is now about $49\\times$ smaller than at $x_1$ ($0.1007$), roughly the SQUARE of how much it shrank before. That squaring is why Newton reaches four correct decimals in just two corrections.","text_shaken":"$x_2\\approx1.3252$: $f(x_2)\\approx0.00206$, about $49\\times$ smaller than before. Each correction is squaring the previous shrink, not just repeating it.","text_assured":"$f(x_2)\\approx0.00206$ against $f(x_1)\\approx0.1007$ — consistent with $e_{n+1}=O(e_n^2)$, the textbook signature of quadratic convergence."}]}
```
