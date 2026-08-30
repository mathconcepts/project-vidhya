---
# Alternative body for graph-connectivity.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: graph-connectivity.intuition.assured
concept_id: graph-connectivity
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: graph-connectivity-intuition
for_stance: assured
---

Whitney's chain $\kappa(G)\leq\lambda(G)\leq\delta(G)$ is tight at both ends on different graphs — a single bridge forces $\lambda=1$ regardless of $\delta$, while $K_n$ achieves $\kappa=\lambda=\delta=n-1$ everywhere at once. Never assume closeness between the three without checking which structure you actually have.

A cut vertex and a bridge are independent failures: a graph can have a bridge with no cut vertex only if that bridge is a pendant edge to a leaf (removing the leaf disconnects nothing left), and a cut vertex can exist with no bridge incident to it at all — two triangles sharing a vertex has a cut vertex but zero bridges, since every edge sits in a cycle.

Directed connectivity has no analogous chain: strongly connected requires both-direction reachability for every pair; weakly connected only requires the underlying undirected graph to be connected. A tournament (every pair joined one way) is always weakly connected but need not be strongly connected.
