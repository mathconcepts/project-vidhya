---
# Alternative body for graph-connectivity.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: graph-connectivity.hook.assured
concept_id: graph-connectivity
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: graph-connectivity.hook
for_stance: assured
---

Edge connectivity $\lambda(G)$ and vertex connectivity $\kappa(G)$ both name a break point, but they're not the same number: $\kappa(G)\leq\lambda(G)\leq\delta(G)$ always, where $\delta(G)$ is the minimum degree. A single bridge gives $\lambda=1$ regardless of how large or dense the rest of the graph is — one weak link caps the whole graph's edge connectivity, however strong every other edge looks.
