---
id: graph-basics.intuition
concept_id: graph-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
---

## What is a Graph?

A **graph** is a collection of **vertices** (or nodes) connected by **edges** (or links). Think of it as a network of points and the connections between them. Graphs are fundamental in GATE because they model real-world relationships: social networks, communication systems, circuit topologies, and data structures.

### Core Building Blocks

**Vertices ($V$):** The basic units. A graph $G = (V, E)$ has a set of vertices. Each vertex is distinct.

**Edges ($E$):** Connections between pairs of vertices. An edge $(u, v)$ connects vertices $u$ and $v$. In an **undirected graph**, edges have no direction — $(u,v)$ equals $(v,u)$. In a **directed graph**, direction matters — $(u \to v)$ is different from $(v \to u)$.

### Degree: Measuring Connectivity

The **degree** of a vertex is the number of edges incident to it. 
- In undirected graphs, $\deg(v)$ counts all edges touching $v$.
- In directed graphs, we distinguish **in-degree** (edges entering) and **out-degree** (edges leaving).

For a GATE exam, the most powerful insight is the **handshaking lemma**: 

$$\sum_{v \in V} \deg(v) = 2|E|$$

This says the sum of all degrees equals twice the number of edges. Why? Because each edge connects two vertices and contributes 1 to each endpoint's degree — counting from the vertex side double-counts every edge.

**Exam relevance:** This lemma appears in nearly every GATE problem involving degree sequences, connectivity analysis, or graph properties. Memorize it cold.
