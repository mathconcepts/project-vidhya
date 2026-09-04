---
# Alternative body for least-squares.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
id: least-squares.intuition.shaken
concept_id: least-squares
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: least-squares.intuition
for_stance: shaken
---

Same matrix as the hook: $P=\begin{pmatrix}0.8&0.4\\0.4&0.2\end{pmatrix}$.

Feed in $(2,1)$: out comes $(2,1)$ — no change.

Feed in $(1,-2)$: out comes $(0,0)$ — gone completely.

Feed in anything else, and it lands somewhere on the line through $(2,1)$, at the closest point to where it started. That closest-point move is least squares: replace an unsolvable $b$ with the nearest point $Pb$ actually reachable.

Check: the piece removed, $b-Pb$ (called the **residual**), must be perpendicular ("orthogonal," a right angle) to every column of the original matrix. Here the removed direction is $(1,-2)$, and $(1,-2)\cdot(2,1)=1\times2+(-2)\times1=0$ — exactly perpendicular, confirmed.
