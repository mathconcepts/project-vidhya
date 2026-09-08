---
# Alternative body for integration-substitution.hook, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: integration-substitution.hook.shaken
concept_id: integration-substitution
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: integration-substitution.hook
for_stance: shaken
---

$\int 2x\cos(x^2)\,dx$: let $u=x^2$, so $du=2x\,dx$ — exactly the factor sitting outside. The integral becomes $\int\cos u\,du=\sin u+C$. Substitute back: $\sin(x^2)+C$. Check: $\frac{d}{dx}[\sin(x^2)]=\cos(x^2)\cdot2x$. Matches.

```interactive-spec
{"v":1,"kind":"simulation","title":"In u-space the whole integral collapses to a plain sine curve","why":"The x-axis here is u=x^2, not x. Substitution's whole trick is that the messy integral in x becomes this ordinary sine curve once redrawn in terms of u.","x_expr":"t*t","y_expr":"sin(t*t)","t_min":0,"t_max":2,"duration_sec":8,"view_box":{"x_min":-0.2,"x_max":4.2,"y_min":-1.15,"y_max":1.15},"narration_steps":[{"at_progress":0.0,"text":"At $x=0$, the inner function $u=x^2=0$, so the antiderivative $\\sin(u)=0$ too. The horizontal axis here is $u$, not $x$.","text_shaken":"Start: $x=0$, so $u=x^2=0$, and $\\sin(u)=0$.","text_assured":"Axis is $u=x^2$, not $x$ — the whole point of substitution is redrawing the problem in this variable.","focus_point":true},{"at_progress":0.3,"text":"As $x$ grows toward about $1.25$, $u=x^2$ climbs toward $\\pi/2$. Will $\\sin(u)$ keep rising toward its peak of $1$, or has it already started falling?","text_shaken":"$x$ is heading toward about $1.25$, where $u$ will hit $\\pi/2$. Is $\\sin(u)$ still climbing toward $1$, or already falling?","text_assured":"Predict: as $u\\to\\pi/2$, does $\\sin u$ keep climbing to its peak, or has it turned over already?"},{"at_progress":0.627,"text":"At $x\\approx1.253$, $u=x^2=\\pi/2$ exactly, and $\\sin(u)=1$ — the peak. In the original variable this says $\\sin(x^2)$ peaks exactly where $x^2=\\pi/2$.","text_shaken":"At $x\\approx1.253$: $u=\\pi/2$, $\\sin(u)=1$, the peak of the whole curve.","text_assured":"$u=\\pi/2\\Rightarrow\\sin(u)=1$ — the antiderivative $\\sin(x^2)$'s maximum, reached at $x=\\sqrt{\\pi/2}$.","emphasize":true,"focus_point":true},{"at_progress":0.886,"text":"By $x\\approx1.772$, $u=x^2=\\pi$ and $\\sin(u)$ is back to $0$. Nothing about this curve is complicated anymore — it is just an ordinary sine wave, because the substitution replaced the tangled $x$-picture with a plain $u$-picture.","text_shaken":"At $x\\approx1.772$: $u=\\pi$, $\\sin(u)=0$ again — a plain sine wave in $u$.","text_assured":"$u=\\pi\\Rightarrow\\sin(u)=0$ — the substitution turned a composite mess in $x$ into an ordinary sine wave in $u$."},{"at_progress":1.0,"text":"At $x=2$, $u=4$ and $\\sin(4)\\approx-0.757$.","trap":{"text":"Students solve the simplified integral in $u$ and stop there, presenting $\\sin u+C$ as the final answer instead of substituting back.","avoid":"The antiderivative must return to the ORIGINAL variable: $\\sin(x^2)+C$, not $\\sin u+C$ — the substitution is a temporary lens for computing, never a permanent change of variable in the answer."}}]}
```
