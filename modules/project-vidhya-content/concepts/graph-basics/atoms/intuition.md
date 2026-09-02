---
id: graph-basics.intuition
concept_id: graph-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.10
exam_ids: ["*"]
modality: visual
---

Every edge has two ends, and each end adds 1 to some vertex's degree. So adding up every vertex's degree counts each edge exactly twice — once from each end. That's the entire mechanism behind the handshaking lemma; nothing else is happening.

Take a triangle $A$-$B$-$C$ with one more vertex $D$ hanging off $A$: four edges, $AB, BC, CA, AD$. Walk around and tally: $A$ touches three of them (degree 3), $B$ and $C$ each touch two (degree 2 apiece), $D$ touches one (degree 1). Add these: $3+2+2+1=8$. That's exactly twice the edge count, $2\times4=8$, because every one of those four edges got counted at both its ends.

This is also why an isolated vertex with no edges has degree 0 — it isn't touched from either end of anything — and why a loop (an edge from a vertex to itself) counts *twice* at that one vertex: both of its ends land on the same spot.
