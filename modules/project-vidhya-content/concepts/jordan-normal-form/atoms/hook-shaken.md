---
# Alternative body for jordan-normal-form.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: jordan-normal-form.hook.shaken
concept_id: jordan-normal-form
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: jordan-normal-form.hook
for_stance: shaken
---

Push arrows through $J=\begin{pmatrix}2&1\\0&2\end{pmatrix}$.

Only one arrow refuses to turn: $(1,0)$, stretched by exactly 2.

Every other arrow shears sideways — even though 2 is a repeated eigenvalue. Just one rail, not two.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[2,1],[0,2]] — only one refuses to turn","duration_sec":9,"linear_map":{"matrix":[[2,1],[0,2]],"num_vectors":16,"eigen":[{"dir":[1,0],"value":2}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows are about to be pushed through $J=\\begin{pmatrix}2&1\\\\0&2\\end{pmatrix}$, a matrix with a repeated eigenvalue: $\\lambda=2,2$. How many rails will survive?","text_shaken":"Sixteen arrows, each length 1, meet $J=\\begin{pmatrix}2&1\\\\0&2\\end{pmatrix}$. The eigenvalue 2 appears twice — watch how many arrows refuse to turn.","text_assured":"$\\lambda=2$ with algebraic multiplicity 2 — the open question is whether the geometric multiplicity actually matches.","emphasize":false},{"at_progress":0.22,"text":"Push! Almost every arrow shears sideways as it stretches — even arrows close to the horizontal axis tilt visibly upward.","text_shaken":"Watch any arrow that is not exactly horizontal: it tilts upward as it grows. That sideways shear is the whole story.","text_assured":"The shear is the extra 1 in $J$'s corner acting: $Jv=2v+(v_1,0)$ picks up a horizontal nudge for any $v$ off the axis.","emphasize":false},{"at_progress":0.55,"text":"Only one arrow refuses to turn: the one along $(1,0)$, stretched by exactly 2. Every other direction, however close, shears off — there is no second rail.","text_shaken":"Check $(1,0)$: it grows to 2 times as long, same direction. Check anything else: it tilts. Only one survivor, not two.","text_assured":"$J(1,0)^T=(2,0)^T=2(1,0)^T$, and $(A-2I)v=0$ has only a 1-dimensional solution space — geometric multiplicity 1.","emphasize":true},{"at_progress":0.8,"text":"Algebraic multiplicity 2, geometric multiplicity 1 — that gap is exactly why one Jordan block replaces a diagonal matrix here. The missing second rail is the reason Jordan form exists.","text_shaken":"Two on paper, one on the picture. That gap between 2 and 1 is exactly why this matrix needs a Jordan block, not a diagonal one.","text_assured":"$m_J(x)=(x-2)^2$, size-2 block: the minimal polynomial's exponent names the largest block, not the algebraic multiplicity itself.","emphasize":false,"trap":{"text":"Students see the repeated eigenvalue 2 and assume $J$ acts like uniform scaling — as if $J=2I$, with every arrow just stretching in place.","avoid":"Solve $(J-2I)v=0$ and count independent solutions — one solution here means one Jordan block, not a diagonal matrix."}}]}
```
