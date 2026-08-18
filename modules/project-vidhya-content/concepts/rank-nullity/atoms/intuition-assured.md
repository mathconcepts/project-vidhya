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

$\text{rank}(A)+\text{nullity}(A)=n$, where $n$ is the number of columns — every input dimension either survives into the output (rank) or collapses to zero (nullity), with nothing left over.

Rank is the dimension of the column space (equivalently, row space — always equal, even though the two spaces live in different places). Nullity is the dimension of $\ker(A)=\{x : Ax=0\}$.

## Where it earns marks

- $\text{rank}(A)=n \iff$ trivial null space $\iff$ $A$ injective $\iff$ (square case) $A$ invertible
- Free variables in $Ax=b$'s solution set (when consistent) equal the nullity, directly — no extra computation needed
- Row-reduce once, read the pivot count as rank, read $n-\text{rank}$ as nullity — one elimination answers both

Common trap: rank-nullity is about the **domain**, not the codomain — a $3\times5$ matrix satisfies $\text{rank}+\text{nullity}=5$, regardless of what the output space looks like.
