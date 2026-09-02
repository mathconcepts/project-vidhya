---
# Alternative body for spectral-theorem.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
id: spectral-theorem.intuition.shaken
concept_id: spectral-theorem
atom_type: intuition
bloom_level: 2
difficulty: 0.15
modality: visual
exam_ids: ["*"]
variant_of: spectral-theorem.intuition
for_stance: shaken
---

$A = \begin{pmatrix} 2 & 1 \\ 1 & 2 \end{pmatrix}$ is symmetric. The two directions $(1,1)$ and $(1,-1)$ turn out perpendicular.

Face along those two directions instead of the usual $x,y$ axes. From there $A$ just stretches: by $3$ along $(1,1)$, by $1$ along $(1,-1)$. No mixing.

Scale each direction to length $1$ — $\tfrac{1}{\sqrt2}(1,1)$, $\tfrac{1}{\sqrt2}(1,-1)$ — as columns of $Q$; put the two stretch numbers on the diagonal of $\Lambda$.

$$A = Q\Lambda Q^T$$

Check: $Q^TQ = I$, since the columns are perpendicular unit vectors — that's what lets $Q^T$ rotate back alone, no inverse needed.
