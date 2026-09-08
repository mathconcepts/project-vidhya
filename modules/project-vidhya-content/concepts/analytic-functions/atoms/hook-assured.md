---
# Alternative body for analytic-functions.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: analytic-functions.hook.assured
concept_id: analytic-functions
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: analytic-functions.hook
for_stance: assured
---

The rigidity people quote — analytic on a disc pins down the function everywhere connected — needs the domain to actually be connected; "everywhere" only reaches where an analytic continuation exists, not automatically the whole plane. $z^{1/2}$ is complex-differentiable off a branch cut but nowhere near entire; $1/z$ is analytic on $\mathbb{C}\setminus\{0\}$, not on all of $\mathbb{C}$. One differentiable point does nothing; a whole neighborhood does everything — that gap, not "complex numbers are somehow stronger," is the actual content of the claim. Watch $w=z^2$, the simplest entire case, in the figure that follows: the same doubling-the-angle rule governs every point on the loop simultaneously, the single algebraic identity that rigidity ultimately rests on.

```interactive-spec
{"v":1,"kind":"simulation","title":"Image of the unit circle under w = z^2","x_expr":"cos(2*t)","y_expr":"sin(2*t)","t_min":0,"t_max":6.283185307179586,"duration_sec":8,"why":"Squaring doubles the angle of every point on the circle — the same algebraic rule holds everywhere at once, the rigidity a real function never has.","narration_steps":[{"at_progress":0.0,"text":"z sweeps once around the unit circle, starting at (1, 0). Drawn here is only its image w = z^2 — as z completes one full loop, how many times does w loop around the origin: once, or something else?","text_shaken":"z sweeps once around the unit circle, starting at (1, 0). This traces only the image, w = z^2 — watch how many times it goes around.","text_assured":"w = z^2 traced as z sweeps the unit circle once from (1, 0) — how many times does w wind around the origin?","emphasize":false,"focus_point":true},{"at_progress":0.25,"text":"z has swept a quarter turn; w is already at (-1, 0) — a half turn done, twice as fast as z.","text_shaken":"z has gone a quarter of the way around. w is already at (-1, 0) — halfway around its own loop already.","text_assured":"Quarter turn in z; w already at (-1, 0), a half-turn done — arg(w) = 2 arg(z).","emphasize":false,"focus_point":true},{"at_progress":0.5,"text":"z has only swept a half turn, from (1, 0) to (-1, 0) — but w is already back at (1, 0), having completed one FULL revolution.","text_shaken":"z is only halfway around, at (-1, 0). But w has already made one whole trip and is back at (1, 0).","text_assured":"z at the half-turn mark; w has already wound once, back at (1, 0) — one full revolution for half of z's.","emphasize":false,"focus_point":true},{"at_progress":0.7,"text":"Squaring doubles the argument at every instant: arg(z^2) = 2 arg(z), everywhere, without exception — the same algebraic rule, holding at once across the whole loop.","text_shaken":"The rule is simple: squaring doubles the angle, always. That's true at every single point on the circle, all at the same time.","text_assured":"arg(z^2) = 2 arg(z) identically — one algebraic rule pinning down the map's behavior at every point simultaneously.","emphasize":true},{"at_progress":0.9,"text":"One full sweep of z gives w exactly two full sweeps around the origin.","trap":{"text":"Students expect w to complete one loop for one loop of z, the way squaring positive real numbers never 'wraps around' anything.","avoid":"arg(z^2) = 2 arg(z), so for one full revolution of z (2*pi in angle), w's angle grows by 4*pi — two full revolutions, the winding-number signature of the z^2 map, true everywhere, not a coincidence of the starting point."}}]}
```
