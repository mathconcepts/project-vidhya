---
id: graph-basics.formal-definition
concept_id: graph-basics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.40
exam_ids: ["*"]
---

For a graph $G=(V,E)$, the **degree** $\deg(v)$ of a vertex $v$ is the number of edge-endpoints at $v$ (a loop at $v$ contributes 2, since both its ends land there).

**Handshaking Lemma:**

$$\sum_{v\in V}\deg(v) = 2|E|$$

Every edge has exactly two endpoints, so summing degrees over all vertices counts each edge twice. **Corollary:** the number of odd-degree vertices in any graph is even (an odd count of odd terms would make the total sum odd, contradicting the lemma).

**Method selector.** Use the handshaking lemma directly whenever a question hands you a degree sequence (or an average degree) and asks for $|E|$ — divide the degree sum by 2. Don't reach for constructing or drawing the graph first to count edges by hand; that's slower and error-prone beyond a handful of vertices, and the lemma gives the exact edge count without needing to know which specific edges exist.
