---
id: trees.exam-pattern
concept_id: trees
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions on Kruskal's or Prim's want the total MST weight, or occasionally a single accepted/rejected edge's status.** Sort by weight, add greedily while skipping anything that would close a cycle, and stop the moment $n-1$ edges are in — later edges never need to be examined.

- **NAT questions on Cayley's formula want a labeled-tree count for a small $n$.** The formula $n^{n-2}$ is direct substitution, not a search.

  Example: for $n=6$ labeled vertices, the number of distinct labeled trees is $6^{4}=1296$ — one substitution, one exponentiation, done.

- **MCQ "true/false" options test whether the MST is unique.** The standard trap: a graph with **repeated** edge weights can have more than one valid MST (all sharing the same total weight); the MST is guaranteed unique only when every edge weight is distinct.

- **MSQ questions on trees vs. general graphs mix the equivalent characterizations** — connected + $n-1$ edges, acyclic + $n-1$ edges, unique path between every pair — expecting you to recognize each phrasing describes the same object, not different ones.

- **Time budget:** Kruskal's on a graph with under 10 vertices should finish in under two minutes including the sort step. A Cayley's-formula NAT question is arithmetic only — under 30 seconds once $n$ is identified correctly.
