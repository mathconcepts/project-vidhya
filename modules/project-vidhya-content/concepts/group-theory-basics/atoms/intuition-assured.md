---
# Alternative body for group-theory-basics.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: group-theory-basics.intuition.assured
concept_id: group-theory-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["gate-ma"]
scaffold_fade: 0
variant_of: group-theory-basics-intuition
for_stance: assured
---

A subgroup claim needs three checks against the base group, not four: associativity is inherited automatically from $G$, since it holds for every pair in $G$ and therefore for any subset, so what actually needs verifying on a subset $H$ is $e\in H$, $H$ closed under the operation, and $H$ closed under inverses — assuming closure because $G$ has it, instead of checking $H$ directly, is the usual gap.

Lagrange's theorem runs one direction only: $|H|$ dividing $|G|$ is necessary for $H$ to be a subgroup, never sufficient for one to exist. $A_4$ has order $12$, and $6\mid12$, yet $A_4$ has no subgroup of order $6$ — divisibility passing proves nothing about existence.

Cyclic and abelian aren't interchangeable: every cyclic group is abelian, but $S_3$ is a non-abelian group with a cyclic (hence abelian) subgroup sitting inside it, so having an abelian piece says nothing about the whole. Cosets partition $G$ into pieces of size $|H|$ regardless of which structural question is at stake, and that partition is exactly what the index $[G:H]$ counts.
