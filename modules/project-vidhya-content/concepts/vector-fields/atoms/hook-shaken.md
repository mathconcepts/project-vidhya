---
# Alternative body for vector-fields.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
#
# Concrete-first, smallest true step, arithmetic shown in full, explicit
# check at the end. No mention of how the reader might be feeling.
id: vector-fields.hook.shaken
concept_id: vector-fields
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: vector-fields.hook
for_stance: shaken
---

Take the field $\mathbf F(x,y)=(x,y)$.

At the point $(1,0)$: plug in, $\mathbf F=(1,0)$ — an arrow pointing right.

At the point $(0,1)$: plug in, $\mathbf F=(0,1)$ — an arrow pointing straight up.

Same field, two different points, two completely different arrows. That is what a vector field is: one arrow value at each point, found by substituting that point's coordinates into the field's formula.

Check: at $(-1,-1)$, $\mathbf F=(-1,-1)$ — an arrow pointing down-left, distinct from both arrows above.

```interactive-spec
{"v": 1, "kind": "simulation", "title": "A leaf released into F(x,y)=(x,y) — straight line, or curve?", "why": "This is the field from the hook, F(x,y)=(x,y), pushing a real particle. Watching where it actually goes — its flow line — versus what the field says at one point is exactly what GATE flow-line questions test.", "x_expr": "exp(t)", "y_expr": "exp(t)", "t_min": 0, "t_max": 0.6931471805599453, "duration_sec": 7, "ghost": {"x_expr": "1.5*cos(t)", "y_expr": "1.5*sin(t)"}, "narration_steps": [{"at_progress": 0, "text": "A leaf sits at $(1,1)$ in the field $\\mathbf F(x,y)=(x,y)$ from the hook. Release it — predict: as it drifts to a new point, does the push it feels change, and does the path curve?", "text_shaken": "Start at $(1,1)$. The field's arrow there is $(1,1)$ too — release the leaf and watch where it drifts.", "text_assured": "$(1,1)$ under $\\mathbf F(x,y)=(x,y)$: predict whether the flow line — the trajectory a released particle traces — stays straight or bends.", "focus_point": true, "emphasize": false}, {"at_progress": 0.35, "text": "The leaf is drifting outward, still exactly on the line $y=x$. At every point it passes, the field's push still points straight along that same line.", "text_shaken": "The leaf is moving away from the centre, staying exactly on the diagonal line $y=x$.", "text_assured": "En route, $\\mathbf F(x,y)=(x,y)$ stays parallel to the direction of travel at every instant — no sideways push ever appears.", "emphasize": false}, {"at_progress": 0.5, "text": "Now at about $(1.41,1.41)$ — still on the same straight line. The velocity here, $\\left(\\frac{dx}{dt},\\frac{dy}{dt}\\right)$, equals $(x,y)$ itself: the push and the position are the same vector, always.", "text_shaken": "About $(1.41,1.41)$ now. Check the velocity: $\\frac{dx}{dt}=e^t=x$ and $\\frac{dy}{dt}=e^t=y$ — the push always exactly equals the leaf's own position.", "text_assured": "$\\frac{d\\mathbf r}{dt}=\\mathbf r(t)=\\mathbf F(\\mathbf r(t))$ at every instant — the defining property of a flow line, made visible: velocity equals field value along the path.", "focus_point": true, "emphasize": false}, {"at_progress": 0.75, "text": "The leaf is most of the way out, still moving along the straight line — no sign of turning back toward the origin.", "text_shaken": "Still moving straight out, no curving back.", "text_assured": "No component of $\\mathbf F$ ever points back toward the origin along this path — ruling out any inward turn before it happens.", "emphasize": false, "trap": {"text": "Students expect the push to eventually curve the leaf back toward the centre, the way many force fields (or an orbit) would.", "avoid": "Check whether the field's direction ever rotates away from the direction of travel — here it never does, since $\\mathbf F(x,y)=(x,y)$ always points exactly along the position vector, so the path stays straight, not curved."}}, {"at_progress": 1.0, "text": "The leaf has reached $(2,2)$ — the flow line is a straight ray from the origin, not a curve, because the push never stopped pointing along the direction the leaf was already moving.", "text_shaken": "Arrived at $(2,2)$. A straight line the whole way, because the push always matched the direction of travel.", "text_assured": "$\\mathbf r(t)=(e^t,e^t)$ solves $\\mathbf r'=\\mathbf F(\\mathbf r)$ exactly — a straight-line flow line, the honest exception rather than the rule for a general field.", "focus_point": true, "emphasize": true}]}
```
