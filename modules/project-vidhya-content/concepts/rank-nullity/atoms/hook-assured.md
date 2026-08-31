---
# Alternative body for rank-nullity.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: rank-nullity.hook.assured
concept_id: rank-nullity
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: rank-nullity.hook
for_stance: assured
---

$\text{rank}(A)+\text{nullity}(A)=n$ for any $A$ with $n$ columns — the dimensions the map preserves plus the dimensions it collapses to zero exhaust the domain. Rank governs solvability of $Ax=b$; nullity counts the free parameters in the solution set once it exists.

```interactive-spec
{"v":1,"kind":"simulation","title":"Sixteen arrows meet [[1,2],[0.5,1]] — one rail survives, one dies at the origin","duration_sec":9,"linear_map":{"matrix":[[1,2],[0.5,1]],"num_vectors":16,"eigen":[{"dir":[1,0.5],"value":2},{"dir":[2,-1],"value":0}]},"narration_steps":[{"at_progress":0,"text":"Sixteen arrows, all length 1, are about to be pushed through the matrix $\\begin{pmatrix}1&2\\\\0.5&1\\end{pmatrix}$. Watch where every one of them ends up.","text_shaken":"Count them: sixteen arrows, each length 1, standing around a circle. All sixteen are about to move at once.","text_assured":"Rank 1: row two is exactly half of row one, so the whole output has to collapse onto a single line — watch it happen.","emphasize":false},{"at_progress":0.22,"text":"Push! Every arrow starts sliding toward the same slanted line. None of them scatters — they are all converging on one rail.","text_shaken":"Watch any one arrow: it is not spreading out, it is sliding toward the same tilted line as all the others.","text_assured":"$Av$ for every $v$ is a multiple of $(1,0.5)$ here — that is rank 1, stated as motion instead of algebra.","emphasize":false},{"at_progress":0.55,"text":"Now the whole plane has landed. Every arrow sits on one line — the one that doubles arrows' length — except one, which shrank all the way down to a single point at the center. That one direction was crushed to zero.","text_shaken":"Look at the picture now: every arrow tip is on one line, except one arrow, which is gone — it landed exactly on the center dot.","text_assured":"$A(1,0.5)^T=(2,1)^T$: doubled, still on the same line. $A(2,-1)^T=(0,0)^T$: erased. One direction survives, one direction dies.","emphasize":true},{"at_progress":0.8,"text":"One dimension kept its direction and doubled in size; one dimension was crushed to nothing. Kept plus killed is rank plus nullity — here 1 + 1 = 2, the whole plane accounted for.","text_shaken":"The rule in one line: rank counts what survives, nullity counts what's crushed. Here that's 1 and 1, and 1+1=2 — nothing is left over.","text_assured":"$\\text{rank}(A)+\\text{nullity}(A)=n$ is not a coincidence here — it is this picture, every time, for every matrix.","emphasize":false,"trap":{"text":"Students see two nonzero rows and count the rank as 2, missing that row two is exactly half of row one.","avoid":"Compare the rows before counting: row two $=0.5\\times$ row one, so only one row is independent — rank 1, not 2."}}]}
```
