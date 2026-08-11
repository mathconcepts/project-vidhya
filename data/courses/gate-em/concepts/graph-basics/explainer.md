# Graph Basics
> GATE Engineering Mathematics | Graph Theory | High frequency | difficulty: 0.3

## Intuition First
A graph is a roadmap made of cities (vertices) and highways (edges) connecting them. The same roadmap structure shows up everywhere—computer networks, chemical bonds, social relationships—so understanding graphs unlocks patterns in almost every domain.

## Core Definition
**Graph Definition**: A graph $G = (V, E)$ consists of a finite set $V$ of vertices (also called nodes) and a finite set $E$ of edges, where each edge connects exactly two distinct vertices. Formally, $E \subseteq \{(u, v) : u, v \in V, u \neq v\}$. An edge $(u, v)$ is called **undirected** if order does not matter; a directed edge (arc) is denoted $(u, v) \to (w, x)$ and establishes a one-way connection.

**Degree**: The degree $\deg(v)$ of a vertex $v$ is the number of edges incident to it. In a directed graph, the **in-degree** $d^{in}(v)$ counts incoming edges, and the **out-degree** $d^{out}(v)$ counts outgoing edges.

**Handshaking Lemma**: For any undirected graph, $\sum_{v \in V} \deg(v) = 2|E|$. (Each edge contributes 1 to the degree of two vertices, so total degree equals twice the edge count.)

## What Happens (Worked Example)
Label: "**What happens:**"

Consider the simple graph with vertices $V = \{A, B, C, D\}$ and edges $E = \{(A,B), (B,C), (C,D), (D,A), (A,C)\}$.

- Vertex degrees: $\deg(A) = 3$, $\deg(B) = 2$, $\deg(C) = 3$, $\deg(D) = 2$.
- Total degree: $3 + 2 + 3 + 2 = 10$.
- Number of edges: $|E| = 5$.
- Verification (Handshaking Lemma): $2 \times 5 = 10$ ✓

This graph is drawn as a square $A$–$B$–$C$–$D$ with an additional diagonal from $A$ to $C$. Each vertex "touches" the number of edges indicated by its degree.

Label: "**Why it works:**"

The Handshaking Lemma holds because every edge is an unordered pair of vertices. When we sum degrees, each edge $(u, v)$ is counted exactly twice—once in $\deg(u)$ and once in $\deg(v)$. Therefore, the total degree must equal $2|E|$.

## GATE MA Relevance
> **Why it matters in GATE MA:** Graph basics appear in ~15–20% of graph theory questions, typically as direct degree-counting or handshaking lemma verification in NAT or 1-mark MCQs. GATE often pairs this with connectivity or component analysis to test depth.
