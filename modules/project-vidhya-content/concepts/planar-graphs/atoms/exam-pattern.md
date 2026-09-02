---
id: planar-graphs.exam-pattern
concept_id: planar-graphs
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions usually give two of $V$, $E$, $F$ and want the third**, via Euler's formula on a connected planar graph. Read the question for the word "connected" — the formula only holds as stated for one component.

  Example: $V=8$, $E=18$. $F = 2 - V + E = 2 - 8 + 18 = 12$. Checking the density bound: $E \leq 3V-6 = 18$ — equality, meaning this is a **maximal planar graph** (every face is a triangle, no edge can be added without creating a crossing).

- **MCQ/MSQ "which is true" questions test the standard fact list:**
  - $K_5$ and $K_{3,3}$ are the two smallest non-planar graphs, and every non-planar graph contains a subdivision of one of them (Kuratowski's theorem).
  - $E\leq 3V-6$ is necessary for planarity, never sufficient on its own — a graph can satisfy it and still be non-planar (this is exactly $K_{3,3}$'s situation).
  - A bipartite planar graph satisfies the tighter $E\leq 2V-4$.

- **A graph satisfying the density bound is a "maybe," not a "yes."** GATE sometimes gives a graph that satisfies $E\leq 3V-6$ specifically to test whether a student stops checking there — the bound passing is the setup for a Kuratowski-subdivision question, not the answer.

- **Time budget:** given $V$ and $E$ directly, the Euler's-formula computation and the density-bound check together should cost under a minute — it's arithmetic, not search. Reserve extra time only for a question that requires actually locating a $K_5$ or $K_{3,3}$ subdivision inside a larger drawn graph.
