---
# Alternative body for null-space-column-space.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: null-space-column-space.intuition.shaken
concept_id: null-space-column-space
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: null-space-column-space.intuition
for_stance: shaken
---

Same matrix as the animation above, $C=\begin{pmatrix}1&-1\\-1&1\end{pmatrix}$. Watch two specific test vectors go through it.

```interactive-spec
{"v":1,"kind":"simulation","title":"Same matrix, two specific vectors — which one survives?","why":"Naming which vector dies and which survives IS the null-space/column-space split — the same picture, read as a definition instead of a demonstration.","duration_sec":8,"linear_map":{"matrix":[[1,-1],[-1,1]],"num_vectors":16,"eigen":[{"dir":[1,-1],"value":2},{"dir":[1,1],"value":0}]},"narration_steps":[{"at_progress":0,"text":"Same matrix as the animation above, $C=\\begin{pmatrix}1&-1\\\\-1&1\\end{pmatrix}$. Before it moves: feed in $x=(1,1)$ — does $Cx$ survive, or does it vanish?","text_shaken":"Same matrix as before. One question: if you push $x=(1,1)$ through $C$, does it come out as something, or as nothing?","text_assured":"Two specific test vectors this time, not sixteen arrows: $(1,1)$ and $(1,-1)$. One names the null space, one names the column space.","emphasize":false},{"at_progress":0.35,"focus_eigen":[1],"text":"Watch $(1,1)$ alone: it slides straight toward the centre.","text_shaken":"Follow just this one arrow: it is shrinking toward the middle, not toward the slanted line.","text_assured":"$(1,1)$ is heading for the origin — the null space, by definition the set of inputs $C$ sends to $\\mathbf{0}$.","emphasize":false},{"at_progress":0.6,"focus_eigen":[0],"text":"Now $(1,-1)$: it lands further out on the same slanted line every other surviving arrow uses.","text_shaken":"This arrow does not vanish — it stretches, but stays on the tilted line.","text_assured":"$(1,-1)$ survives onto $\\mathrm{span}(1,-1)$ — the column space: everything $C$ is actually capable of producing.","emphasize":false},{"at_progress":0.85,"text":"$C(1,1)^T=(0,0)^T$: erased — that is the null space, dimension 1. $C(1,-1)^T=(2,-2)^T$: survived — that is the column space, also dimension 1. $1+1=2$, the two columns $C$ started with, fully accounted for.","text_shaken":"One line to keep: the vector that died has dimension 1 (the null space), the vector that lived has dimension 1 (the column space), and $1+1=2$ uses up both columns.","text_assured":"$\\dim(\\text{null space})+\\dim(\\text{column space})=n$ isn't a coincidence to memorise — it's exactly this picture, for any matrix.","emphasize":true,"trap":{"text":"Students grab a column of $C$ itself — say $(1,-1)$ — and call it \"the null space vector\" because it looks special in the picture.","avoid":"A column of $C$ tells you where an OUTPUT can land (column space). The null space is an INPUT that produces zero — solve $Cx=0$ to find it, never read it off a column."}}]}
```

Two things to remember: a vector mapping to $\begin{pmatrix}0\\0\end{pmatrix}$ is in the **null space**. A vector that survives lands in the **column space**. Their dimensions always add up to the number of columns: here, $1+1=2$.
