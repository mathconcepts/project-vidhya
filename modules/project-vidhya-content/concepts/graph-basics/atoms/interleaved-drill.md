---
id: graph-basics.interleaved-drill
concept_id: graph-basics
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: graph basics → graph connectivity.**

Take vertices $\{A,B,C,D,E\}$ with edges $\{AB, AC, DE\}$.

**Question 1 (graph basics):** Verify the handshaking lemma on this graph and state $|E|$.

*Answer:* Degrees are $\deg(A)=2$, $\deg(B)=1$, $\deg(C)=1$, $\deg(D)=1$, $\deg(E)=1$. Sum $=6=2\times3$, matching $|E|=3$ exactly.

**Question 2 (graph connectivity):** Is this graph connected? If not, how many components does it have?

*Answer:* No. $\{A,B,C\}$ is one connected piece (via edges $AB$ and $AC$), and $\{D,E\}$ is a separate piece (via edge $DE$) — nothing links the two groups. Two components. Note the degree sequence alone never signaled this: every vertex has a perfectly ordinary degree, and the handshaking lemma checks out cleanly on the whole disconnected graph exactly as it would on a connected one.

**Why this drill exists:** students who've just verified a degree sequence sometimes assume a "valid," lemma-passing graph must be one connected structure. Degree and connectivity answer different questions — a graph can be degree-sequence-perfect and still be two or more separate pieces, because the handshaking lemma sums locally at each vertex and has no way to see the global shape.
