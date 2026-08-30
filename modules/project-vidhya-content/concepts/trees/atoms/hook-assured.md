---
# Alternative body for trees.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: trees.hook.assured
concept_id: trees
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: trees.hook
for_stance: assured
---

Five equivalent characterizations collapse to one object: connected with $n-1$ edges, acyclic with $n-1$ edges, a unique path between every pair, and every edge a bridge — proving any one of these for a specific graph proves all five. What actually earns marks: $n-1$ edges alone proves nothing without one more fact, either connected or acyclic, since a disconnected forest of several small components can also carry exactly $n-1$ edges in total across all $n$ vertices, without being one tree.
