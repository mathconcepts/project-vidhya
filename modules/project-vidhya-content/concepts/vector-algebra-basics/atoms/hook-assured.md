---
# Alternative body for vector-algebra-basics.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: vector-algebra-basics.hook.assured
concept_id: vector-algebra-basics
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: vector-algebra-basics.hook
for_stance: assured
---

Two vectors of equal magnitude never combine to more than twice that magnitude, and only reach that ceiling when they point the same way — governed by $|\vec a+\vec b|^2=|\vec a|^2+|\vec b|^2+2\vec a\cdot\vec b$. The distinction worth marks: $\vec a\cdot\vec b=0$ tests **perpendicularity**, but $\vec a\times\vec b=\vec 0$ tests **parallelism** — they are not two routes to the same fact, and GATE options routinely swap one condition for the other to catch a guess.

```interactive-spec
{"v":1,"kind":"simulation","title":"Why the resultant follows a half-angle cosine, not a straight-line drop","why":"Sweeps the hook's own 5 N forces from 0° to 180°, showing the resultant magnitude follows |R|=10cos(θ/2) — slow to drop at first, steep near the end.","x_expr":"5+5*cos(t)","y_expr":"5*sin(t)","t_min":0,"t_max":3.14159265,"duration_sec":7,"narration_steps":[{"at_progress":0.0,"text":"At $\\theta=0°$, both forces point due east — resultant $10$ N, the maximum possible. As $\\theta$ grows toward $180°$, does the resultant shrink at a STEADY rate, or slowly at first and then much faster?","text_shaken":"At $0°$: resultant $10$ N. As the angle grows to $180°$, will the resultant shrink evenly, or slowly then fast?","text_assured":"$|\\vec a+\\vec b|$ at $\\theta=0$ is $10$ N. Predict the shape of its decline to $0$ N at $\\theta=180°$ before the reveal: linear, or cosine-shaped?"},{"at_progress":0.33333,"focus_point":true,"text":"At $\\theta=60°$ — the hook's own case — the resultant sits at $(7.5,4.33)$, magnitude $\\sqrt{75}\\approx8.66$ N: a real drop from $10$ N, but still closer to the top than the bottom.","text_shaken":"At $60°$: resultant $(7.5,4.33)$, magnitude $\\approx8.66$ N — matches the hook's own answer.","text_assured":"$\\theta=60°\\Rightarrow|\\vec R|\\approx8.66$ N, only $13.4\\%$ down from the maximum — the drop is still gentle here."},{"at_progress":0.5,"focus_point":true,"emphasize":true,"text":"At $\\theta=90°$ — a quarter turn — resultant $(5,5)$, magnitude $\\approx7.07$ N. The formula behind every one of these numbers: $|\\vec R|=10\\cos(\\theta/2)$, a cosine curve, not a straight line.","text_shaken":"At $90°$: resultant $(5,5)$, magnitude $\\approx7.07$ N. The rule is $|\\vec R|=10\\cos(\\theta/2)$ — a cosine shape, not a straight drop.","text_assured":"$|\\vec R|=10\\cos(\\theta/2)$ exactly, from $|\\vec a+\\vec b|^2=|\\vec a|^2+|\\vec b|^2+2\\vec a\\cdot\\vec b$ with equal magnitudes — cosine, never linear."},{"at_progress":0.85,"text":"Past $\\theta=90°$ the resultant keeps falling, now much faster than it did over the first $90°$.","text_shaken":"After $90°$, the resultant falls off fast — much faster than the first $90°$ did.","text_assured":"Beyond $\\theta=90°$, $\\cos(\\theta/2)$ is already dropping steeply — most of the total decline happens in this second half.","trap":{"text":"Students expect the SECOND $90°$ of rotation (from $90°$ to $180°$) to cost the same magnitude as the FIRST $90°$ did.","avoid":"$|\\vec R|=10\\cos(\\theta/2)$ drops only $2.93$ N over the first $90°$ but the full remaining $7.07$ N over the second $90°$ — check the half-angle formula, not a linear split."}}]}
```
