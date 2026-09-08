---
# Alternative body for stokes-theorem.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: stokes-theorem.hook.shaken
concept_id: stokes-theorem
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: stokes-theorem.hook
for_stance: shaken
---

Trace the unit circle $x^2+y^2=1$ once, in the $z=0$ plane, tracking $\mathbf F\cdot d\mathbf r$ the whole way round. That is one closed loop, walked directly — nothing yet about trading it for an integral over some surface stretched across the loop.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "Circulation of F=(-y,x,0) around the unit circle, capped by any surface", "why": "Same field F=(-y,x,0), same circle from this concept's own worked example. Watching circulation land on 2π while any cap over this rim gives the identical curl flux is Stokes' own promise, not just Green's.", "x_expr": "cos(t)", "y_expr": "sin(t)", "t_min": 0, "t_max": 6.283185307179586, "duration_sec": 8, "narration_steps": [{"at_progress": 0, "text": "Trace the unit circle counterclockwise, in the field $\\mathbf F=(-y,x,0)$, starting at $(1,0)$. Predict: if you instead traversed this same circle clockwise, would the circulation total flip sign, stay the same, or become unrelated?", "text_shaken": "Start at $(1,0)$ on the unit circle, field $\\mathbf F=(-y,x,0)$. Walk it counterclockwise.", "text_assured": "$(1,0)$: predict how reversing $C$'s direction affects $\\oint_C\\mathbf F\\cdot d\\mathbf r$, and why the right-hand rule forces that outcome.", "focus_point": true, "emphasize": false}, {"at_progress": 0.5, "text": "Halfway round, at $(-1,0)$, the running circulation is $\\pi\\approx3.14$ — exactly half of what the flat disk's curl flux, $2\\times\\pi(1)^2=2\\pi$, will total once the loop closes.", "text_shaken": "At $(-1,0)$, halfway: running total $\\approx3.14$.", "text_assured": "$(-1,0)$: running total $=\\pi$, tracking half the disk's curl flux — the same number a flat disk, a bowl, or any other cap on this rim would give.", "focus_point": true, "emphasize": false}, {"at_progress": 0.75, "text": "Three-quarters round, running total $\\approx4.71$ — still climbing at the same steady rate.", "text_shaken": "Three-quarters round: running total $\\approx4.71$.", "text_assured": "$3\\pi/2\\approx4.71$ so far, on pace for $2\\pi$ regardless of which surface eventually caps this rim.", "emphasize": false, "trap": {"text": "Students assume reversing the direction of travel around $C$ leaves the circulation unchanged, since it's still \"the same loop.\"", "avoid": "Reversing $C$ also reverses $\\hat n$ by the right-hand rule, so both sides of Stokes flip sign together — the circulation becomes $-2\\pi$, not $2\\pi$, for the clockwise walk."}}, {"at_progress": 1.0, "text": "Back at $(1,0)$ — the loop closes at a running total of exactly $2\\pi$. Any surface spanning this same rim — flat disk, bowl, or funnel — gives that identical curl flux, as long as curl stays smooth in between; the boundary alone decided the answer.", "text_shaken": "Back at $(1,0)$: total $=2\\pi\\approx6.28$.", "text_assured": "$\\oint_C\\mathbf F\\cdot d\\mathbf r=2\\pi=\\iint_S(\\nabla\\times\\mathbf F)\\cdot d\\mathbf S$ for every admissible $S$ sharing this rim — the surface-choice freedom Stokes adds beyond Green's flat-only case.", "focus_point": true, "emphasize": true}]}
```
