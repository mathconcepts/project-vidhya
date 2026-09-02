---
# Alternative body for graph-basics.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinction that actually costs
# marks rather than re-teaching what they can already do.
id: graph-basics.hook.assured
concept_id: graph-basics
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: graph-basics.hook
for_stance: assured
---

You know $\sum\deg(v)=2|E|$. The distinction worth a mark: this is an identity, true for every graph, multigraphs and loops included. A self-loop at $v$ contributes 2 to $\deg(v)$, not 1, since both its ends coincide there. The corollary — the number of odd-degree vertices is always even — is *weaker* than the identity itself; it doesn't recover $|E|$ on its own. A question asking for the edge count needs the full degree sum, not just a parity check on how many vertices are odd.
