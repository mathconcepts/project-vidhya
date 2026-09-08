---
# Alternative body for taylor-laurent.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
id: taylor-laurent.hook.shaken
concept_id: taylor-laurent
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: taylor-laurent.hook
for_stance: shaken
---

Near $z=0$, $\dfrac1{1-z}=1+z+z^2+z^3+\cdots$ — an ordinary Taylor series, matching the function as closely as you like with enough terms. Now look at $\dfrac1z$ itself at $z=0$: no Taylor series exists there, but allow the single negative power $z^{-1}$, and the "series" is just $\dfrac1z$ — one term, already exact. That negative-power piece is what Laurent adds. Below, a point slides out from $0$, past two poles at $1$ and $2$ — watch the series change each time it crosses one.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sliding past the poles of f(z) = z / ((z-1)(z-2))","x_expr":"t","y_expr":"0","t_min":0,"t_max":3,"duration_sec":8,"why":"Slides z out along the real axis through this concept's own poles at 1 and 2, showing each ring between them carries its own distinct Laurent series around the same center.","narration_steps":[{"at_progress":0.0,"text":"z starts at (0, 0), the point this Laurent series is centered on. It slides right along the real axis. The function's poles sit at z = 1 and z = 2 — will the SAME series that works near 0 keep converging once z passes z = 1?","text_shaken":"z starts at (0, 0), the expansion center. It slides right along the real axis, toward the poles at z = 1 and z = 2. Does the same series near 0 keep working past z = 1?","text_assured":"z starts at (0, 0) and slides along the real axis past the poles at 1 and 2 — does the series centered at 0 stay valid past z = 1?","emphasize":false,"focus_point":true},{"at_progress":0.3,"text":"At (0.9, 0), still short of the pole at z = 1 — still inside the disc |z| < 1 where the ORIGINAL Taylor-like series (centered at 0, no negative powers needed yet) is guaranteed to converge.","text_shaken":"At (0.9, 0) — still short of z = 1. Still inside the disc where the first series is valid.","text_assured":"At (0.9, 0): inside |z| < 1, the disc where the ordinary power series about 0 converges.","emphasize":false,"focus_point":true},{"at_progress":0.5,"text":"Past z = 1 now, at (1.5, 0) — inside the ring 1 < |z| < 2 between the two poles. The disc series from before no longer applies; a DIFFERENT series, with negative powers of z, takes over here.","text_shaken":"Past z = 1, at (1.5, 0). A different series, with negative powers, is needed here — the first one no longer applies.","text_assured":"At (1.5, 0), inside the annulus 1 < |z| < 2 — the disc series is gone; the annulus series (its own principal part) governs here.","emphasize":true,"focus_point":true},{"at_progress":0.7,"text":"Past z = 2 now, at (2.1, 0) — outside BOTH poles. A third series applies out here, since a Laurent expansion is tied to a specific ring: which ring you stand in decides which series is valid, not the function's formula alone.","text_shaken":"Past z = 2 too, at (2.1, 0). A third series applies out here — the ring you're standing in decides which series works.","text_assured":"At (2.1, 0), beyond both poles: a third annulus, a third series — each ring around 0 has its own expansion.","emphasize":false,"focus_point":true},{"at_progress":0.967,"text":"z has slid from the center out past both poles, through three separate rings.","trap":{"text":"Students expect one Laurent series centered at 0 to describe f(z) everywhere its poles don't sit, as if only the two exact pole points were special.","avoid":"Each ring between the poles carries its OWN distinct series: 0 < |z| < 1, 1 < |z| < 2, and |z| > 2 each have a different Laurent expansion around the same center 0, and none of them equals another outside its own ring."}}]}
```
