---
# Alternative body for derivatives-basic.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: derivatives-basic.hook.assured
concept_id: derivatives-basic
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: derivatives-basic.hook
for_stance: assured
---

GATE phrases this as "rate of change" or "instantaneous rate," and the tempting wrong answer is the average rate $\frac{f(b)-f(a)}{b-a}$ when the question asks for the derivative *at a point*. The average is a secant's slope across an interval; the derivative is a tangent's slope at one instant. The two coincide only in the limit as the interval shrinks to zero — never for a finite interval, however small it looks.

```interactive-spec
{"v":1,"kind":"simulation","title":"The secant slope through cos(x) converges to -1, not +1","x_expr":"1.5707963+0.9-0.88*t","y_expr":"cos(1.5707963+0.9-0.88*t)","t_min":0.0,"t_max":1.0,"duration_sec":7,"view_box":{"x_min":1.45,"x_max":2.6,"y_min":-0.9,"y_max":1.0},"narration_steps":[{"at_progress":0.0,"text":"A point on $y=\\cos x$ starts at $x=2.471$, where $\\cos(2.471)=-0.783$ — well below the axis, on its way toward $x=\\pi/2$.","text_shaken":"At $x=2.471$: $\\cos(2.471)=-0.783$. That's the first point — compute it before anything else.","text_assured":"The secant through $(\\pi/2+h,\\cos(\\pi/2+h))$ and $(\\pi/2,0)$, as $h\\to0$ — its slope is what this converges to."},{"at_progress":0.4,"text":"By $x=2.119$, $\\cos x=-0.521$. The secant slope from $x_0=\\pi/2$ is already $-0.951$ — negative, and steepening.","text_shaken":"At $x=2.119$: $\\cos(2.119)=-0.521$. Slope so far: $(-0.521-0)/0.548=-0.951$.","text_assured":"Already negative and steepening: $\\cos$ is decreasing through $\\pi/2$, so its instantaneous rate there must be negative too."},{"at_progress":0.8,"text":"At $x=1.767$, the real curve sits at $-0.195$ — below the axis. The dashed line, drawn with the sign dropped, sits at $+0.196$ — above it. Same $x$, opposite sign.","text_shaken":"At $x=1.767$: real curve $-0.195$; dashed (dropped sign) $+0.196$. Same $x$, opposite sign — check which one you're computing.","text_assured":"$(\\cos x)'=-\\sin x$, not $\\sin x$ — the sign is the entire content of the identity, not a detail to round off.","trap":{"text":"Students differentiate $\\cos x$ and drop the minus sign, writing $\\frac{d}{dx}\\cos x=\\sin x$.","avoid":"Memorize the pair together: $(\\sin x)'=\\cos x$, $(\\cos x)'=-\\sin x$ — check the sign every time."}},{"at_progress":1.0,"text":"The secant slope has converged to $-0.9999$, matching $-\\sin(\\pi/2)=-1$ exactly. The dashed (wrong-sign) path would have landed at $+0.02$ — the opposite side of the axis.","text_shaken":"At $x\\approx\\pi/2$, slope $\\approx-0.9999$. Not $+1$. The minus sign in $(\\cos x)'=-\\sin x$ is not optional.","text_assured":"Slope $\\to-\\sin(\\pi/2)=-1$ exactly — every $\\cos$ derivative inherits this same sign flip that $\\sin$'s does not.","emphasize":true}],"ghost":{"x_expr":"1.5707963+0.9-0.88*t","y_expr":"0.9-0.88*t"}}
```
