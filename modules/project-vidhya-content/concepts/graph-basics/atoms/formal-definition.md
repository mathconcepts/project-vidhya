---
id: graph-basics.formal-definition
concept_id: graph-basics
atom_type: formal_definition
bloom_level: 2
difficulty: 0.24
exam_ids: ["*"]
---

**Graph Definition**: A graph $G = (V, E)$ consists of a finite set $V$ of vertices (also called nodes) and a finite set $E$ of edges, where each edge connects exactly two distinct vertices. Formally, $E \subseteq \{(u, v) : u, v \in V, u \neq v\}$. An edge $(u, v)$ is called **undirected** if order does not matter; a directed edge (arc) is denoted $(u, v) \to (w, x)$ and establishes a one-way connection.

**Degree**: The degree $\deg(v)$ of a vertex $v$ is the number of edges incident to it. In a directed graph, the **in-degree** $d^{in}(v)$ counts incoming edges, and the **out-degree** $d^{out}(v)$ counts outgoing edges.

**Handshaking Lemma**: For any undirected graph, $\sum_{v \in V} \deg(v) = 2|E|$. (Each edge contributes 1 to the degree of two vertices, so total degree equals twice the edge count.)
