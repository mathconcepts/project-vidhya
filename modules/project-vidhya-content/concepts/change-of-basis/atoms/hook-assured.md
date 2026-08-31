---
# Alternative body for change-of-basis.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: change-of-basis.hook.assured
concept_id: change-of-basis
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: change-of-basis.hook
for_stance: assured
---

Coordinates are basis-dependent; the vector isn't. $[x]_B$ and $[x]_{B'}$ describe the same geometric object under two different bases, related by $[x]_{B'} = P^{-1}[x]_B$ for the change-of-basis matrix $P$.

The one thing worth locking in early: $P$'s columns are the *old* basis vectors written in the *new* basis's coordinates. Build it that way and every conversion collapses to a single matrix multiply — getting the direction backwards is the exam's favorite trap.

```interactive-spec
{"v":1,"kind":"simulation","title":"Matrix [[1,1],[-1,2]] — its columns ARE the new basis","duration_sec":9,"linear_map":{"matrix":[[1,1],[-1,2]],"num_vectors":16},"narration_steps":[{"at_progress":0,"text":"Two arrows, $e_1=(1,0)$ and $e_2=(0,1)$, are about to be pushed through $\\begin{pmatrix}1&1\\\\-1&2\\end{pmatrix}$. Watch where each one lands — that landing spot IS the new basis.","text_shaken":"Two arrows start out: $e_1$ pointing right, $e_2$ pointing up. They're about to move. Watch exactly where each one lands.","text_assured":"The whole change-of-basis machinery reduces to this one picture: where does the matrix send $e_1$ and $e_2$? Those landing spots are $P$'s columns.","emphasize":false},{"at_progress":0.22,"text":"Push! Watch the arrow that started pointing right, and the arrow that started pointing straight up — they are heading toward two brand-new directions.","text_shaken":"Watch the arrow at the very right (that's $e_1$) and the arrow at the very top (that's $e_2$). Both are moving toward new spots.","text_assured":"Every arrow morphs continuously, but only two of the sixteen carry meaning here: the images of $e_1$ and $e_2$ — everything else is filler for the eye.","emphasize":false},{"at_progress":0.55,"text":"The arrow from the right has swung to point toward $(1,-1)$. The arrow from the top has swung to point toward $(1,2)$. Two new directions, two new basis arrows.","text_shaken":"Right arrow now points toward $(1,-1)$. Top arrow now points toward $(1,2)$. Those are the two new directions.","text_assured":"$e_1\\mapsto(1,-1)$, $e_2\\mapsto(1,2)$ — exactly the matrix's two columns, read straight off without computing anything.","emphasize":true},{"at_progress":0.8,"text":"Those two landing arrows ARE the new basis, written in the old coordinates. A matrix's columns are always where it sends $e_1$ and $e_2$ — that never changes, whatever the matrix is.","text_shaken":"The two arrows you just watched land — $(1,-1)$ and $(1,2)$ — are literally the matrix's two columns. That is always true, for any matrix.","text_assured":"$P=[e_1'\\,|\\,e_2']$ built exactly this way satisfies $[x]_E=P[x]_B$ — new-basis coordinates go IN, old-basis coordinates come OUT.","emphasize":false,"trap":{"text":"Students build $P$ from these new-basis arrows and then multiply directly to get new coordinates from old: $[x]_{new}=P[x]_{old}$.","avoid":"$P$ sends NEW-basis coordinates to OLD ($[x]_E=P[x]_B$); to get new coordinates from old, use $P^{-1}$, never $P$ itself."}}]}
```
