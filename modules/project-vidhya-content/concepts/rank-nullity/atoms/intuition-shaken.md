---
# Alternative body for rank-nullity.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: rank-nullity.intuition.shaken
concept_id: rank-nullity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: rank-nullity.intuition
for_stance: shaken
---

Take $A=\begin{pmatrix}1&2\\2&4\end{pmatrix}$. Row 2 is $2\times$ row 1 — no new information. Only **one** row is genuinely independent, so $\text{rank}(A)=1$.

$A$ has $2$ columns. One dimension is "used" by the rank; the other is "lost" — that's the **nullity**: $\text{nullity}(A)=2-1=1$. Check it directly: $A\begin{pmatrix}2\\-1\end{pmatrix}=\begin{pmatrix}0\\0\end{pmatrix}$, so that direction carries no signal through the matrix at all.

## The theorem in one line

$$\text{rank}(A)+\text{nullity}(A)=n$$

where $n$ is the number of columns. Every column either adds a genuinely new output direction (counted by rank) or gets absorbed into the null space (counted by nullity) — there's nowhere else for a dimension to go.

## Why GATE cares

- Rank tells you whether $Ax=b$ has a solution at all
- Full rank ($\text{rank}=n$) means $A$ is invertible
- Rank-nullity tells you immediately how many free variables a solution set has
- It links row reduction, independence, and system consistency into one fact
