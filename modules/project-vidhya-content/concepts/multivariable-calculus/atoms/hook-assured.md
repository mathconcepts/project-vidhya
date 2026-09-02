---
# Alternative body for multivariable-calculus.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: multivariable-calculus.hook.assured
concept_id: multivariable-calculus
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: multivariable-calculus.hook
for_stance: assured
---

A single partial derivative is a SLICE, not the whole story: $\partial f/\partial x$ and $\partial f/\partial y$ together form the gradient $\nabla f=(\partial f/\partial x,\partial f/\partial y)$, which points in the direction of steepest ascent — a direction that generally lines up with neither pure axis. Reading $\partial f/\partial x$ alone as "the" rate of change at a point conflates one slice's slope with the full local behavior; the rate along an arbitrary direction $(\cos\theta,\sin\theta)$ is the directional derivative $\nabla f\cdot(\cos\theta,\sin\theta)$, which reduces to the plain partial only when that direction is a coordinate axis.

```interactive-spec
{"v":1,"kind":"simulation","title":"Freezing y=1 gives the true slope through (1,1); freezing y=2 gives a different hill entirely","x_expr":"t","y_expr":"t*t","t_min":-2,"t_max":2,"duration_sec":7,"view_box":{"x_min":-2.3,"x_max":2.3,"y_min":-0.4,"y_max":8.4},"narration_steps":[{"at_progress":0.0,"text":"This traces $f(x,1)=x^2\\cdot1$ — the slice of $f(x,y)=x^2y$ through $y=1$. At $x=-2$: height $=4$.","text_shaken":"At $x=-2$, $y$ frozen at $1$: height $=(-2)^2\\cdot1=4$.","text_assured":"$f(x,y)=x^2y$ sliced at $y=1$ — an ordinary single-variable curve, the whole point of freezing a partial derivative's other variable.","emphasize":false},{"at_progress":0.4,"text":"At $x=0$, the slice bottoms out at height $0$ — flat there, since $f(0,1)=0$ and the slope of $x^2$ at $x=0$ is $0$.","text_shaken":"At $x=0$: height $=0$. Slope of this slice at $x=0$ is $0$.","text_assured":"A flat tangent at $x=0$ reflects $\\partial f/\\partial x=0$ along THIS slice only — it says nothing yet about $\\partial f/\\partial y$.","emphasize":false},{"at_progress":0.75,"text":"At $x=1$, height is $1$, and the slope of this curve at $x=1$ is $2$ — that slope IS $\\partial f/\\partial x$ at the point $(1,1)$.","text_shaken":"At $x=1$: height $=1$, slope $=2$. That is $\\partial f/\\partial x$ at $(1,1)$.","text_assured":"$\\partial f/\\partial x=2xy$; at $(1,1)$ that is $2(1)(1)=2$ — exactly the slice's slope here.","emphasize":true},{"at_progress":1.0,"text":"At $x=2$, height is $4$. The dashed curve shows what freezing $y=2$ instead would trace — twice as steep everywhere, a different hill.","text_shaken":"At $x=2$: real slice height $=4$. Dashed ($y=2$ frozen): height $=8$ — a different, wrong slice.","text_assured":"$2xy$ at $y=2$ is $4x$, double the true $2x$ at $y=1$ — an easy arithmetic slip with a large graphical consequence.","emphasize":false,"trap":{"text":"Students freeze the OTHER variable at a value that feels generic — like $2$ — instead of reading it off the actual point they were given.","avoid":"Freeze $y$ at the point's real coordinate. At $(1,1)$ that is $y=1$, giving $f(x,1)=x^2$ and $\\partial f/\\partial x|_{(1,1)}=2$ — not the slope of the $y=2$ slice."}}],"ghost":{"x_expr":"t","y_expr":"2*t*t"}}
```
