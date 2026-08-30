---
# Alternative body for mean-value-theorems.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: mean-value-theorems.intuition.shaken
concept_id: mean-value-theorems
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: mean-value-theorems.intuition
for_stance: shaken
---

Leave at noon, arrive at 4 PM, covering $200$ km. Average speed: $\frac{200}{4}=50$ km/h. Did the speedometer read exactly $50$ at some moment? Yes — not luck, the Mean Value Theorem.

Average rate of change over the whole trip is $\frac{f(b)-f(a)}{b-a}$; instantaneous rate at one moment is $f'(x)$. These are different kinds of numbers — one summarizes the whole interval, the other is a single instant — and MVT guarantees that somewhere in between, they agree exactly.

Picture the graph of position against time. Draw the straight line connecting the start point and the end point — its slope is the average speed. MVT says there is at least one point on the curve where the tangent line is parallel to that straight line — same slope, different location.

This isn't only about driving. MVT is the tool behind proving a function is increasing (if $f'>0$ everywhere on an interval, the average slope between any two points is positive, forcing $f(b)>f(a)$), behind bounding how much a function can change (if $|f'|\le M$, no two points can differ in value by more than $M$ times their distance apart), and behind connecting a derivative's behavior to the function's own shape.

The one thing MVT promises and the one thing it withholds: somewhere, the instantaneous and average rates match — but never which point, only that one exists.
