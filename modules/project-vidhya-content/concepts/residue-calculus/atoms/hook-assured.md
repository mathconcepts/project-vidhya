---
# Alternative body for residue-calculus.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks rather than re-teaching what they can already do.
id: residue-calculus.hook.assured
concept_id: residue-calculus
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: residue-calculus.hook
for_stance: assured
---

The one-line summary hides a condition: it only works when every singularity inside is a pole (a finite negative-power tail). At an essential singularity like $e^{1/z}$'s at $z=0$, the residue is still just the $c_{-1}$ Laurent coefficient, but the limit shortcut $\lim_{z\to z_0}(z-z_0)f(z)$ doesn't exist — the coefficient has to come from the series itself: $e^{1/z}=\sum_{n=0}^\infty\frac{z^{-n}}{n!}$ gives residue $1$, the $n=1$ term, read off, not computed. The animation below is the ordinary-pole case: two residues, opposite signs, canceling to zero — the shortcut still requires summing correctly, not just counting poles.

```interactive-spec
{"v":1,"kind":"simulation","title":"The loop |z| = 2 trapping both poles of 1 / (z(z-1))","x_expr":"2*cos(t)","y_expr":"2*sin(t)","t_min":0,"t_max":6.283185307179586,"duration_sec":8,"why":"Reuses the |z|=2 contour from this concept's own worked example (poles at 0 and 1) to show the answer depends on the SUM of enclosed residues, not merely how many poles are trapped.","narration_steps":[{"at_progress":0.0,"text":"This loop is |z| = 2, starting at (2, 0) and sweeping once. The function 1/(z(z-1)) has poles at z = 0 and z = 1 — do BOTH poles lie inside this loop, or does the loop leave one of them out?","text_shaken":"This loop is |z| = 2, starting at (2, 0). The function has poles at z = 0 and z = 1 — are both of them inside this loop?","text_assured":"|z| = 2 traced from (2, 0) — with poles of 1/(z(z-1)) at 0 and 1, are both enclosed?","emphasize":false,"focus_point":true},{"at_progress":0.3,"text":"A quarter turn in, at (0, 2). Both z = 0 and z = 1 sit well inside this loop — |0| = 0 and |1| = 1 are each less than the loop's radius 2. Neither pole is missed.","text_shaken":"A quarter turn in, at (0, 2). Both poles, at 0 and 1, sit inside — their distances from the origin, 0 and 1, are both less than 2.","text_assured":"Quarter turn: (0, 2). Both poles enclosed — |0|, |1| < 2.","emphasize":false,"focus_point":true},{"at_progress":0.5,"text":"Halfway around, at (-2, 0). Sum the residues: -1 at z = 0, +1 at z = 1 — they cancel to 0. The residue theorem gives 2*pi*i times that sum, so the integral is exactly 0 — not because nothing is inside, but because what's inside cancels.","text_shaken":"Halfway around, at (-2, 0). The residues are -1 at z = 0 and +1 at z = 1. Add them: 0. So the integral is 0 too — the two poles cancel each other out.","text_assured":"Halfway: (-2, 0). Res(0) + Res(1) = -1 + 1 = 0, so the integral is 2*pi*i * 0 = 0 — cancellation, not vacancy.","emphasize":true,"focus_point":true},{"at_progress":0.75,"text":"Three-quarters around, at (0, -2), still tracing the same loop. Warp this circle into a wobbly oval instead and the answer stays 0, as long as it still traps exactly these same two poles.","text_shaken":"At (0, -2), still on the loop. Even a differently-shaped loop would give the same answer, 0, as long as it still traps these same two poles.","text_assured":"At (0, -2). The exact contour shape is irrelevant — only which poles it encloses matters.","emphasize":false,"focus_point":true},{"at_progress":0.9,"text":"Back at the start: two poles sat trapped inside this loop the whole way around, and their residues canceled.","trap":{"text":"Students see two singularities inside a loop and assume the integral must be nonzero — more poles trapped, they reason, means a bigger answer.","avoid":"What matters is the SUM of the residues, not how many poles are enclosed — here two poles contribute -1 and +1, which cancel exactly, giving 0 despite two singularities sitting inside."}}]}
```
