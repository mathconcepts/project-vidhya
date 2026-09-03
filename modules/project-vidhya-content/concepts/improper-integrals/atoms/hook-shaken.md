---
# Alternative body for improper-integrals.hook, served when the learner
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
id: improper-integrals.hook.shaken
concept_id: improper-integrals
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: improper-integrals.hook
for_stance: shaken
---

Look at $1/x^2$ starting from $x=1$. At $x=1$: height $1$. At $x=2$: height $0.25$, running area so far $0.5$. At $x=8$: height $0.016$, running area $0.875$. Push $x$ further and the running area keeps creeping toward $1$ but never reaches past it. Check: is the height shrinking fast? Yes — squared in the denominator. That fast shrink is why the total stays finite even though the strip never ends.

```interactive-spec
{"v":1,"kind":"simulation","title":"1/x^2's tail keeps shrinking — the running area closes in on 1, never past it","x_expr":"t","y_expr":"1/(t*t)","t_min":1,"t_max":8,"duration_sec":8,"view_box":{"x_min":0,"x_max":8.4,"y_min":-0.05,"y_max":1.1},"narration_steps":[{"at_progress":0.0,"text":"At $x=1$, the height is $1/1^2=1$ — the tallest point of the whole infinite tail.","text_shaken":"At $x=1$: height $=1/1^2=1$. That is the starting value.","text_assured":"$y=1/x^2$ traced from $x=1$ outward — the question is whether the area under this endless tail is finite.","emphasize":false},{"at_progress":0.25,"text":"By $x=2$, the height has dropped to $1/4=0.25$. Running area so far, $\\int_1^2 x^{-2}dx=1-\\tfrac12=0.5$, is already more than half of where it will ever end up.","text_shaken":"At $x=2$: height $=1/4$. Running area: $\\int_1^2 x^{-2}dx=1-1/2=0.5$.","text_assured":"Half the eventual total is already banked by $x=2$ — the tail contributes fast at first, then almost nothing.","emphasize":false},{"at_progress":0.6,"text":"At $x=4.5$, the height is down to about $0.049$. Running area: $\\int_1^{4.5}x^{-2}dx=1-\\tfrac{1}{4.5}\\approx0.778$.","text_shaken":"At $x=4.5$: height $\\approx0.049$. Running area $\\approx0.778$.","text_assured":"Diminishing returns from here on — each further unit of width adds a shrinking sliver, not a substantial one.","emphasize":true},{"at_progress":0.85,"text":"The strip never ends. Does that running area keep climbing past $1$ forever, or level off below $1$ no matter how far $x$ goes?","text_shaken":"The area is $0.778$ by $x=4.5$ and still climbing, but slower. If $x$ keeps growing without end, does the area ever pass $1$, or stay under it forever?","text_assured":"An endless domain doesn't decide this alone — does the shrinking height outpace the growing width enough to cap the total?","emphasize":false},{"at_progress":1.0,"text":"No — it stays under. At $x=8$, height is down to $1/64\\approx0.016$ and the running area is $1-\\tfrac18=0.875$: still short of $1$, closing in but never passing it. The area converges to exactly $1$.","text_shaken":"No. At $x=8$: height $\\approx0.016$. Running area $=0.875$. Never reaches or passes $1$ — it converges to exactly $1$.","text_assured":"$\\int_1^N x^{-2}dx=1-\\tfrac1N\\to1$ as $N\\to\\infty$ — a genuine finite limit, not a number the domain merely 'runs out of room' to exceed.","emphasize":false,"trap":{"text":"Students see a domain that never ends and assume the area under it must be infinite too, treating an endless width as automatically decisive.","avoid":"Compare the shrinking height against the growing width: for $1/x^2$ the height shrinks fast enough that the running total converges to $1$; for the similar-looking $1/x$, it does not converge at all — the exponent decides it, not the domain's length."}}],"ghost":{"x_expr":"t","y_expr":"1/t"}}
```
