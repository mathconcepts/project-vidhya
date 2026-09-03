---
# Alternative body for definite-integrals.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: definite-integrals.hook.shaken
concept_id: definite-integrals
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: definite-integrals.hook
for_stance: shaken
---

A car drives forward at $2$ m/s for $3$ s, then backward at $2$ m/s for $3$ s. Distance moved forward: $6$ m. Distance moved backward: $6$ m, counted as $-6$. Add the signed pieces: $6+(-6)=0$ — net displacement, since the car ends where it started. A definite integral adds signed pieces the same way: whatever sits below the axis subtracts. Check: does the total match where the motion ended? Here, back at the start, so $0$ is correct.

```interactive-spec
{"v":1,"kind":"simulation","title":"sin(t) sweeps a full cycle — net signed area returns to 0","x_expr":"t","y_expr":"sin(t)","t_min":0,"t_max":6.2831853,"duration_sec":8,"view_box":{"x_min":-0.3,"x_max":6.6,"y_min":-1.3,"y_max":1.3},"narration_steps":[{"at_progress":0.0,"text":"At $t=0$, the inflow rate is $\\sin(0)=0$ — the reservoir sits at its starting level, about to fill.","text_shaken":"Start point: $t=0$, rate $=\\sin(0)=0$. Nothing banked yet.","text_assured":"A full period of $\\sin t$ traced from $0$ to $2\\pi$ — the net signed area is the question, not the curve's shape.","emphasize":false},{"at_progress":0.25,"text":"By $t=\\pi/2$, the rate peaks at $\\sin(\\pi/2)=1$. Everything so far has been positive: the running total, $\\int_0^{\\pi/2}\\sin t\\,dt=1$, is climbing.","text_shaken":"At $t=\\pi/2$: rate $=1$, the fastest filling gets. Running total so far: $1$.","text_assured":"Peak inflow at $t=\\pi/2$ — the running integral $\\int_0^{\\pi/2}\\sin t\\,dt=1$ is at its steepest climb.","emphasize":false},{"at_progress":0.5,"text":"At $t=\\pi$, the rate crosses back to $\\sin(\\pi)=0$. Everything up to here was filling: $\\int_0^{\\pi}\\sin t\\,dt=2$ — the largest the running total ever gets.","text_shaken":"At $t=\\pi$: rate back to $0$. Total banked so far: $\\int_0^\\pi\\sin t\\,dt=2$. That is the running maximum.","text_assured":"Half the period done, running total at its maximum of $2$ — the second half now drains it, symmetric in shape, opposite in sign.","emphasize":true},{"at_progress":0.75,"text":"Past $t=\\pi$, the curve dips below the axis. At $t=3\\pi/2$, the rate is $\\sin(3\\pi/2)=-1$: the reservoir is draining as fast as it filled.","text_shaken":"At $t=3\\pi/2$: rate $=-1$. Below the axis now — this strip subtracts from the running total instead of adding.","text_assured":"Draining at the same peak rate the filling half had — by symmetry this half will erase exactly what the first half banked.","emphasize":false},{"at_progress":0.92,"text":"The draining half has been erasing what the filling half banked. As $t$ approaches $2\\pi$, will the running total end up positive, negative, or back at exactly $0$?","text_shaken":"The draining half keeps erasing the filling half's total. By $t=2\\pi$: positive, negative, or exactly $0$?","text_assured":"Filling banked $+2$ by $t=\\pi$; symmetry suggests the draining half erases exactly that. Positive, negative, or zero net?","emphasize":false},{"at_progress":1.0,"text":"Exactly $0$ — at $t=2\\pi$ the rate returns to $0$ and the running total has fallen all the way back to $0$: the draining half exactly cancelled the filling half.","text_shaken":"At $t=2\\pi$: rate $=0$, running total $=0$. The second half erased the first half completely.","text_assured":"$\\int_0^{2\\pi}\\sin t\\,dt=[-\\cos t]_0^{2\\pi}=(-1)-(-1)=0$ — signed cancellation, not a coincidence of this particular curve.","emphasize":false,"trap":{"text":"Students expect a large positive total, since the curve clearly moved a great deal over the full cycle — reading motion as if it must accumulate.","avoid":"Track the SIGN at every strip: area below the axis subtracts. The unsigned total $\\int_0^{2\\pi}|\\sin t|\\,dt=4$ is what 'the curve moved a lot' actually measures — a different integral entirely."}}],"ghost":{"x_expr":"t","y_expr":"abs(sin(t))"}}
```
