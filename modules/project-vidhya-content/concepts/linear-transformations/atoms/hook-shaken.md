---
# Alternative body for linear-transformations.hook, served when the learner
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
id: linear-transformations.hook.shaken
concept_id: linear-transformations
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: linear-transformations.hook
for_stance: shaken
---

A shear is a matrix that pushes each point sideways, more the higher it sits.

Push sixteen arrows through it. Most swing sideways and grow — the higher one moves most.

One arrow does not move: the one flat on the x-axis, pointing right. Same direction, same length.

Watch where every arrow starts: still the origin. A slide would carry that point away. This matrix never does.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[1,1],[0,1]] — only one refuses to turn","duration_sec":9,"linear_map":{"matrix":[[1,1],[0,1]],"num_vectors":16,"eigen":[{"dir":[1,0],"value":1}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows, all length 1, are about to be pushed through the matrix $\\begin{pmatrix}1&1\\\\0&1\\end{pmatrix}$ — a shear. Every arrow starts at the origin, and that never changes, no matter how the matrix acts.","text_shaken":"Sixteen arrows, each length 1, stand around a circle. The matrix is about to push every tip at once. Watch where each arrow starts — right at the centre — and keep watching that spot.","text_assured":"A shear, determinant 1, acting on the whole circle of unit arrows at once — the question worth asking before anything moves: which single direction, if any, survives untouched?","emphasize":false},{"at_progress":0.22,"text":"Push! Most arrows swing sideways and stretch — the higher an arrow starts, the further right its tip gets shoved. That sideways slide, proportional to height, is what a shear does.","text_shaken":"Look at the arrow near the top: it slides right as it grows longer. Its direction is changing, not just its length. Most of the sixteen arrows are doing exactly this.","text_assured":"The map sends $(x,y)\\mapsto(x+y,y)$: horizontal shift proportional to $y$, so only $y=0$ can possibly survive with no sideways push at all.","emphasize":false},{"at_progress":0.55,"text":"But the arrow lying flat on the x-axis never turns — same direction, same length, exactly where it started. One stubborn direction, locked in place.","text_shaken":"Check the flat arrow, pointing right along the x-axis: same direction, same length, sitting exactly where it began. It never moved.","text_assured":"$A(1,0)^T=(1,0)^T$: eigenvalue 1, and since it repeats with a 1-dimensional eigenspace, this is the ONLY invariant direction — no second independent one exists.","emphasize":true},{"at_progress":0.8,"text":"A matrix moves every arrow at once, but the shared starting point — the origin — never moves. That's what makes it linear, not just a big list of separate pushes.","text_shaken":"One thing to hold onto: the point where every arrow starts, the origin, never moves. Watch it in the animation — still at the centre, before and after.","text_assured":"Fixing a whole line pointwise (not just one isolated direction) while keeping area exactly 1 is the shear's signature — rarer than 'has an eigenvector', worth naming when you see it.","emphasize":false,"trap":{"text":"Students call a sliding, whole-picture shift 'linear' because it also looks like one simple step applied everywhere at once.","avoid":"Check $T(\\mathbf 0)=\\mathbf 0$ first — watch the arrows' shared tail in the animation: it never leaves the origin. A translation always drags that point away, so it can never be linear."}}]}
```
