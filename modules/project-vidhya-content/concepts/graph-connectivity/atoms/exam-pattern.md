---
id: graph-connectivity.exam-pattern
concept_id: graph-connectivity
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions usually want $\kappa(G)$, $\lambda(G)$, or a component count for a small, explicitly drawn graph.** Look for an obvious bridge or cut vertex before computing anything — a single bridge caps $\lambda(G)$ at 1 regardless of how dense the rest of the graph is.

  Example: the path graph on 4 vertices $1$–$2$–$3$–$4$ has minimum degree $\delta=1$ (the two endpoints). Both $\kappa$ and $\lambda$ also equal $1$ — remove the middle vertex $2$ or $3$, or either middle edge, and the path splits.

- **MCQ "true/false" options lean on the $\kappa\leq\lambda\leq\delta$ inequality and on complete-graph values.** A recurring option states $\kappa(K_n)=\lambda(K_n)=n-1$ — true, since every vertex in $K_n$ is already adjacent to all others.

- **MSQ questions mix cut-vertex and bridge identification on one drawn graph** — expect one option correctly naming a cut vertex, one correctly naming a bridge, and at least one option that swaps the two (calling a bridge a "cut vertex" or vice versa).

- **Time budget:** identifying an obvious bridge or cut vertex by inspection should take under 20 seconds on a small drawn graph. Computing $\kappa(G)$ from scratch (trying vertex removals) should stay under 90 seconds by starting from the lowest-degree vertices first, since $\kappa(G)\leq\delta(G)$ bounds the search.
