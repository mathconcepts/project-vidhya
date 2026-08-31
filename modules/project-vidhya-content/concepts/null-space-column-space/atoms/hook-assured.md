---
# Alternative body for null-space-column-space.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: null-space-column-space.hook.assured
concept_id: null-space-column-space
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: null-space-column-space.hook
for_stance: assured
---

$\text{Null}(A)=\{x:Ax=0\}$; $\text{Col}(A)=\{Ax:x\in\mathbb{R}^n\}$ — the kernel and the image of the same map. $\dim\text{Null}(A)+\dim\text{Col}(A)=n$ (rank-nullity), so the two dimensions trade off directly: shrink one and the other grows.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[1,-1],[-1,1]] — one direction dies, one line catches everything","duration_sec":9,"linear_map":{"matrix":[[1,-1],[-1,1]],"num_vectors":16,"eigen":[{"dir":[1,-1],"value":2},{"dir":[1,1],"value":0}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows, all length 1, are about to meet the matrix $\\begin{pmatrix}1&-1\\\\-1&1\\end{pmatrix}$. Two directions matter here: one that survives, and one that vanishes.","text_shaken":"Sixteen arrows on a circle, each length 1. Watch two of them closely — one is about to disappear.","text_assured":"Symmetric, rank 1: expect one surviving rail and one direction crushed straight into the null space.","emphasize":false},{"at_progress":0.22,"text":"Push! Most arrows swing away from where they started and change length as they slide toward one line.","text_shaken":"Watch any arrow move: it slides toward the same tilted line as the others, changing length as it goes.","text_assured":"Every output is pulled toward $\\mathrm{span}(1,-1)$ — the one-dimensional column space of this rank-1 matrix.","emphasize":false},{"at_progress":0.55,"text":"Two arrows behave differently from the rest. The arrow along $(1,-1)$ stretched to $(2,-2)$ — twice as long, same line. The arrow along $(1,1)$ landed exactly on the center: crushed to zero.","text_shaken":"Check the $(1,-1)$ arrow: it grew to $(2,-2)$, still on the same line. Check the $(1,1)$ arrow: it landed at $(0,0)$. Gone.","text_assured":"$A(1,-1)^T=(2,-2)^T$: the column-space rail, doubled. $A(1,1)^T=(0,0)^T$: the null space, exactly.","emphasize":true},{"at_progress":0.8,"text":"The line every arrow lands on is the column space. The direction that vanished is the null space. One line to catch everything, one direction to kill — both live in this single picture.","text_shaken":"Column space: the line everything lands on. Null space: the one direction that dies. This picture has both.","text_assured":"$\\dim(\\text{null space})+\\dim(\\text{column space})=n$: here $1+1=2$, visible without solving anything.","emphasize":false,"trap":{"text":"Students grab a column of $A$ — here $(1,-1)$ — and call it the null space vector. But $(1,-1)$ is the direction that SURVIVES; the null space is the perpendicular direction $(1,1)$, the one that dies.","avoid":"Solve $Ax=0$ directly: only $(1,1)$ satisfies it. A column of $A$ tells you where outputs land, never what vanishes."}}]}
```
