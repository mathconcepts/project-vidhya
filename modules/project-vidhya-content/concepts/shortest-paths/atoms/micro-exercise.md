---
id: shortest-paths.micro-exercise
concept_id: shortest-paths
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.25
exam_ids: ["*"]
estimated_minutes: 2
---

Directed graph, edges (weight): $A\to B$ (3), $A\to C$ (1), $C\to B$ (1), $B\to D$ (2), $C\to D$ (6). What is the shortest distance from $A$ to $D$?

- **(A)** 3
- **(B)** 4
- **(C)** 5
- **(D)** 7

<details>
<summary>Answer</summary>

**B**. Run Dijkstra from $A$:

$d[A]=0$. Relax $A$'s edges: $d[B]=3$, $d[C]=1$.

Extract $C$ (smallest, $1$). Relax $C\to B$: $d[B]=\min(3,\,1+1)=2$ — improved. Relax $C\to D$: $d[D]=1+6=7$.

Extract $B$ (now $2$). Relax $B\to D$: $d[D]=\min(7,\,2+2)=4$ — improved.

Extract $D$ (distance $4$). Done.

Shortest path: $A\to C\to B\to D$, cost $1+1+2=4$. The direct-looking route $A\to B\to D$ costs $3+2=5$ — one more than the route through $C$, because the cheaper edge into $B$ (via $C$) is not the same as the cheapest-looking edge out of $A$.

</details>
