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
