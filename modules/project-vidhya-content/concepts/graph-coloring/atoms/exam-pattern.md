---
id: graph-coloring.exam-pattern
concept_id: graph-coloring
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.40
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions typically want $\chi(G)$ for a small, explicitly drawn graph** — a cycle, a complete graph, or a small graph built from both. Read off the structure before computing: a cycle's parity settles it in one line ($\chi=2$ if even, $3$ if odd), and a clique of size $r$ inside the graph settles a lower bound of $r$ without touching a coloring algorithm.

  Example: for $C_4$ (an even 4-cycle), asking "how many proper colorings exist using exactly 3 colors" is a chromatic-polynomial question, not a chromatic-number question — $P(C_4,3) = (3-1)^4 + (3-1) = 18$, verified by direct enumeration over all $3^4$ colorings.

- **MCQ/MSQ "which statement is true" questions test the standard fact list, not computation:**
  - $\chi(G) = 2$ iff $G$ is bipartite iff $G$ has no odd cycle.
  - Any clique of size $\omega$ forces $\chi(G) \geq \omega$ — a fast, algorithm-free lower bound.
  - Greedy coloring never uses more than $\Delta(G)+1$ colors, but that count depends on vertex order and is not always $\chi(G)$.
  - Every planar graph satisfies $\chi(G) \leq 4$ (Four Color Theorem) — this is an upper bound on every planar graph, not a claim that every planar graph needs exactly 4.

- **The bound-vs-exact-value distinction is the recurring trap.** A question stating "$G$ is planar" and asking for $\chi(G)$ is testing whether you'll answer "4" reflexively — many planar graphs (any tree, any bipartite planar graph) need only 2.

- **Time budget:** a small explicit graph's chromatic number — clique check, bipartite check, one greedy pass if neither settles it — should cost under 90 seconds. A chromatic-polynomial evaluation at a single $k$ is arithmetic once the formula for that graph family is recalled; budget under a minute once the family is identified.
