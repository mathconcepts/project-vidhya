---
id: rank-nullity.intuition
concept_id: rank-nullity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

Same matrix as the animation above, $A=\begin{pmatrix}1&2\\0.5&1\end{pmatrix}$ — but this time, name the two things it was showing you.

```interactive-spec
{"v":1,"kind":"simulation","title":"Same matrix, one test vector each way — survive or crushed?","why":"Naming which direction is kept and which is crushed IS rank and nullity — the same picture, read as a definition instead of a demonstration.","duration_sec":8,"linear_map":{"matrix":[[1,2],[0.5,1]],"num_vectors":16,"eigen":[{"dir":[1,0.5],"value":2},{"dir":[2,-1],"value":0}]},"narration_steps":[{"at_progress":0,"text":"Same matrix as the animation above, $A=\\begin{pmatrix}1&2\\\\0.5&1\\end{pmatrix}$. Before it moves: feed in $x=(2,-1)$ — does $Ax$ come out as something, or as nothing?","text_shaken":"Same matrix as before. One question: push $x=(2,-1)$ through $A$ — does it survive, or does it disappear?","text_assured":"Two specific test vectors, not sixteen arrows: $(2,-1)$ and $(1,0.5)$. One names the nullity, one names the rank.","emphasize":false},{"at_progress":0.35,"focus_eigen":[1],"text":"Watch $(2,-1)$ alone: it slides all the way to the centre.","text_shaken":"Follow just this one arrow: it is shrinking to the middle, not stretching along the line.","text_assured":"$(2,-1)$ heads for the origin — the null space, the one input direction $A$ sends to $\\mathbf{0}$.","emphasize":false},{"at_progress":0.6,"focus_eigen":[0],"text":"Now $(1,0.5)$: it lands further out, still on the one line every surviving arrow ends up on.","text_shaken":"This arrow does not vanish — it stretches, but stays on the same tilted line as the rest.","text_assured":"$(1,0.5)$ survives onto that one line — the column space, dimension 1, since row 2 added nothing new.","emphasize":false},{"at_progress":0.85,"text":"$A(2,-1)^T=(0,0)^T$: crushed — that's the nullity, 1. $A(1,0.5)^T=(2,1)^T$: survived — that's the rank, also 1. $1+1=2$, the two columns $A$ started with, fully accounted for.","text_shaken":"One line to keep: the direction that died counts as nullity 1, the direction that lived counts as rank 1, and $1+1=2$ uses up both columns.","text_assured":"$\\text{rank}(A)+\\text{nullity}(A)=n$ isn't a coincidence to memorise — it's exactly this picture, for any matrix.","emphasize":true,"trap":{"text":"Students see two nonzero rows in $A$ and count the rank as 2, without checking whether row 2 actually adds a new direction.","avoid":"Compare the rows first: row 2 is $0.5\\times$ row 1 here, so only one row is independent — rank 1, not 2, regardless of how many rows look nonzero."}}]}
```

**Rank** counts how many independent directions the matrix's output actually spans. **Nullity** counts the directions it crushes to zero. The rank-nullity theorem is bookkeeping: they always add up to the number of columns going in —

$$\text{rank}(A) + \text{nullity}(A) = n$$

Here, $1+1=2$. **Why it matters for GATE:** rank determines solvability of $A\mathbf{x}=\mathbf{b}$; full rank ($\text{rank}=n$) means invertible; rank-nullity gives the free-variable count immediately; it links row reduction, linear independence, and system consistency into one fact.
