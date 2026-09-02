---
id: shortest-paths.retrieval-prompt
concept_id: shortest-paths
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
estimated_minutes: 1
retention_tags: ["negative-cycle", "bellman-ford"]
---

A graph has a negative-weight cycle reachable from source vertex S. What can be said about shortest paths from S?

- **(A)** Shortest paths exist and are well-defined.
- **(B)** Shortest paths do not exist; distances can be arbitrarily negative.
- **(C)** Shortest paths exist but are computationally hard to find.
- **(D)** Bellman-Ford can compute accurate distances despite the negative cycle.

<details>
<summary>Answer</summary>

**B**. A negative-weight cycle is a cycle whose total edge weight sum is negative. If such a cycle is reachable from the source $S$, then by traversing the cycle arbitrarily many times, we can make the total path weight arbitrarily negative.

Example: Path from $S$ to vertex $v$ costs 10. There's a negative cycle (cost -5) reachable from $v$. We can reach $v$ at cost 10, then traverse the cycle once for cost $10 - 5 = 5$, twice for $10 - 10 = 0$, three times for $10 - 15 = -5$, etc. There is no minimum finite cost.

**Shortest paths do not exist** when a negative-weight cycle is reachable from the source. The notion of "shortest distance" is undefined—we can always find a cheaper path by going around the cycle again.

Bellman-Ford can detect negative cycles (by checking if a relaxation occurs after $|V| - 1$ iterations), but it cannot compute accurate shortest distances in their presence.

**Answer:** (B) - Shortest paths do not exist; distances can be arbitrarily negative.

</details>
