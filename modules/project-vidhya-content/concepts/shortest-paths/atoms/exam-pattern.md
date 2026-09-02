---
id: shortest-paths.exam-pattern
concept_id: shortest-paths
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT/MCQ questions often stop the algorithm mid-run and ask for its exact state**, not the final answer: "what is $d[v]$ after Dijkstra settles its 3rd vertex," or "how many relaxation passes has Bellman-Ford completed when a specific distance first reaches its final value." These require tracing the algorithm step by step, not just computing a shortest distance directly.

  Example: on a graph with $V=6$ vertices, Bellman-Ford needs at most $V-1=5$ relaxation passes to guarantee every shortest path is found, plus one more pass (the 6th) purely to check for a negative cycle.

- **MCQ/MSQ "which is true" questions test the standard fact list:**
  - Dijkstra requires non-negative edge weights; a single negative edge can produce a wrong (too high) distance without any error or warning.
  - Bellman-Ford detects a negative cycle reachable from the source if any distance still decreases on the $V$-th pass.
  - Floyd-Warshall handles negative edges but not negative cycles; it reports one via a negative entry on the distance matrix's diagonal.
  - A settled vertex in Dijkstra is never revisited — this is the mechanism, not a side detail, and it's exactly what negative weights break.

- **A graph presented as a "network" or "cost matrix" is the same problem in different notation** — read the question for whether weights can be negative before picking an algorithm; the notation doesn't decide it, the actual numbers do.

- **Time budget:** tracing a single Dijkstra or Bellman-Ford pass on a 5–6 vertex graph should cost under 2 minutes. A question asking for the FULL final distance array on a larger graph is the one place slowing down to relax every edge carefully is worth it — a single missed relaxation early on invalidates every distance computed afterward.
