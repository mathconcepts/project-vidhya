---
# Alternative body for multivariable-calculus.hook, served when the learner
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
id: multivariable-calculus.hook.shaken
concept_id: multivariable-calculus
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: multivariable-calculus.hook
for_stance: shaken
---

$f(x,y)=x^2y$. Freeze $y=1$: slice is $f(x,1)=x^2$. At $x=1$: height $1$, slope $2$. That slope, $2$, is $\partial f/\partial x$ at $(1,1)$.

Freeze $y=2$ instead — the wrong value for this point. Slice is $f(x,2)=2x^2$. At $x=1$: height $2$, slope $4$ — double the correct answer.

Check: does the frozen value match the point you were given? Here the point is $(1,1)$, so freeze $y=1$, not $y=2$.

```interactive-spec
{"v":1,"kind":"simulation","title":"Freezing y=1 gives the true slope through (1,1); freezing y=2 gives a different hill entirely","x_expr":"t","y_expr":"t*t","t_min":-2,"t_max":2,"duration_sec":7,"view_box":{"x_min":-2.3,"x_max":2.3,"y_min":-0.4,"y_max":8.4},"narration_steps":[{"at_progress":0.0,"text":"This traces $f(x,1)=x^2\\cdot1$ — the slice of $f(x,y)=x^2y$ through $y=1$. At $x=-2$: height $=4$.","text_shaken":"At $x=-2$, $y$ frozen at $1$: height $=(-2)^2\\cdot1=4$.","text_assured":"$f(x,y)=x^2y$ sliced at $y=1$ — an ordinary single-variable curve, the whole point of freezing a partial derivative's other variable.","emphasize":false},{"at_progress":0.4,"text":"At $x=0$, the slice bottoms out at height $0$ — flat there, since $f(0,1)=0$ and the slope of $x^2$ at $x=0$ is $0$.","text_shaken":"At $x=0$: height $=0$. Slope of this slice at $x=0$ is $0$.","text_assured":"A flat tangent at $x=0$ reflects $\\partial f/\\partial x=0$ along THIS slice only — it says nothing yet about $\\partial f/\\partial y$.","emphasize":false},{"at_progress":0.7,"text":"At $x=1$, height is $1$ and the curve's slope here is $2$. Question: is that slope-value the same thing as $\\partial f/\\partial x$ at the point $(1,1)$ — yes or no?","text_shaken":"At $x=1$: height $=1$, slope $=2$. Is that slope number the same thing as $\\partial f/\\partial x$ at $(1,1)$?","text_assured":"The slice's slope at $x=1$ comes out to $2$. Before computing $\\partial f/\\partial x=2xy$ directly: does slicing at the point's real $y$-value hand you that derivative exactly, or only approximately?","emphasize":false},{"at_progress":0.85,"text":"Yes — that slope IS $\\partial f/\\partial x$ at $(1,1)$: freezing $y$ at the point's real value turns the multivariable question into an ordinary single-variable slope you can just read off.","text_shaken":"Yes. That slope, $2$, IS $\\partial f/\\partial x$ at $(1,1)$ — freezing $y$ turns this into an ordinary slope you can read straight off the curve.","text_assured":"$\\partial f/\\partial x=2xy$; at $(1,1)$ that is $2(1)(1)=2$ — exactly the slice's slope here, confirming the slice IS the derivative, not just related to it.","emphasize":true},{"at_progress":1.0,"text":"At $x=2$, height is $4$. The dashed curve shows what freezing $y=2$ instead would trace — twice as steep everywhere, a different hill.","text_shaken":"At $x=2$: real slice height $=4$. Dashed ($y=2$ frozen): height $=8$ — a different, wrong slice.","text_assured":"$2xy$ at $y=2$ is $4x$, double the true $2x$ at $y=1$ — an easy arithmetic slip with a large graphical consequence.","emphasize":false,"trap":{"text":"Students freeze the OTHER variable at a value that feels generic — like $2$ — instead of reading it off the actual point they were given.","avoid":"Freeze $y$ at the point's real coordinate. At $(1,1)$ that is $y=1$, giving $f(x,1)=x^2$ and $\\partial f/\\partial x|_{(1,1)}=2$ — not the slope of the $y=2$ slice."}}],"ghost":{"x_expr":"t","y_expr":"2*t*t"}}
```
