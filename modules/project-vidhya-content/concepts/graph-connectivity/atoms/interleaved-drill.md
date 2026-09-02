---
id: graph-connectivity.interleaved-drill
concept_id: graph-connectivity
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: graph connectivity → graph basics.**

Take vertices $\{P,Q,R,S,T\}$ with edges $\{PQ, QR, RP, RS, ST\}$ — a triangle $PQR$ with a tail $R$–$S$–$T$ hanging off it.

**Question 1 (graph connectivity):** Is $R$ a cut vertex? If so, what happens when it's removed?

*Answer:* Yes. Removing $R$ deletes edges $QR$, $RP$, and $RS$, leaving only $PQ$ and $ST$ behind — the graph splits into $\{P,Q\}$ and $\{S,T\}$, two components. $R$ was the sole link between the triangle side and the tail side.

**Question 2 (graph basics):** Before removing anything, verify the handshaking lemma on the original graph and give $|E|$.

*Answer:* Degrees: $\deg(P)=2$, $\deg(Q)=2$, $\deg(R)=3$, $\deg(S)=2$, $\deg(T)=1$. Sum $=10=2\times5$, so $|E|=5$ — matching the five listed edges exactly.

**Why this drill exists:** the handshaking lemma is a purely local, per-vertex bookkeeping check — it passes on this graph precisely as it would on any other five-edge graph, connected or not. Students sometimes read "degree sequence checks out" as a certificate that the whole structure is sound, but whether a single vertex like $R$ is secretly load-bearing is a separate, structural question the degree sum can't answer.
