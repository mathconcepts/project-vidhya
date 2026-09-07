---
# Alternative body for rank-nullity.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: rank-nullity.intuition.assured
concept_id: rank-nullity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: rank-nullity.intuition
for_stance: assured
---

Same matrix as the scene above, $A=\begin{pmatrix}1&2\\0.5&1\end{pmatrix}$ — read as a definition rather than a demonstration.

```interactive-spec
{"v":1,"kind":"simulation","title":"Same matrix, one test vector each way — survive or crushed?","why":"Naming which direction is kept and which is crushed IS rank and nullity — the same picture, read as a definition instead of a demonstration.","duration_sec":8,"linear_map":{"matrix":[[1,2],[0.5,1]],"num_vectors":16,"eigen":[{"dir":[1,0.5],"value":2},{"dir":[2,-1],"value":0}]},"narration_steps":[{"at_progress":0,"text":"Same matrix as the animation above, $A=\\begin{pmatrix}1&2\\\\0.5&1\\end{pmatrix}$. Before it moves: feed in $x=(2,-1)$ — does $Ax$ come out as something, or as nothing?","text_shaken":"Same matrix as before. One question: push $x=(2,-1)$ through $A$ — does it survive, or does it disappear?","text_assured":"Two specific test vectors, not sixteen arrows: $(2,-1)$ and $(1,0.5)$. One names the nullity, one names the rank.","emphasize":false},{"at_progress":0.35,"focus_eigen":[1],"text":"Watch $(2,-1)$ alone: it slides all the way to the centre.","text_shaken":"Follow just this one arrow: it is shrinking to the middle, not stretching along the line.","text_assured":"$(2,-1)$ heads for the origin — the null space, the one input direction $A$ sends to $\\mathbf{0}$.","emphasize":false},{"at_progress":0.6,"focus_eigen":[0],"text":"Now $(1,0.5)$: it lands further out, still on the one line every surviving arrow ends up on.","text_shaken":"This arrow does not vanish — it stretches, but stays on the same tilted line as the rest.","text_assured":"$(1,0.5)$ survives onto that one line — the column space, dimension 1, since row 2 added nothing new.","emphasize":false},{"at_progress":0.85,"text":"$A(2,-1)^T=(0,0)^T$: crushed — that's the nullity, 1. $A(1,0.5)^T=(2,1)^T$: survived — that's the rank, also 1. $1+1=2$, the two columns $A$ started with, fully accounted for.","text_shaken":"One line to keep: the direction that died counts as nullity 1, the direction that lived counts as rank 1, and $1+1=2$ uses up both columns.","text_assured":"$\\text{rank}(A)+\\text{nullity}(A)=n$ isn't a coincidence to memorise — it's exactly this picture, for any matrix.","emphasize":true,"trap":{"text":"Students see two nonzero rows in $A$ and count the rank as 2, without checking whether row 2 actually adds a new direction.","avoid":"Compare the rows first: row 2 is $0.5\\times$ row 1 here, so only one row is independent — rank 1, not 2, regardless of how many rows look nonzero."}}]}
```

Rank is $\dim(\text{Col}(A))$ (equivalently row space — always equal, though the two spaces live in different places). Nullity is $\dim\ker(A)$. Where it earns marks: $\text{rank}(A)=n \iff$ trivial null space $\iff A$ injective $\iff$ (square case) invertible. Common trap: rank-nullity is about the **domain**, not the codomain — a $3\times5$ matrix satisfies $\text{rank}+\text{nullity}=5$ regardless of the output space.
