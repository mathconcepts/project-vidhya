---
id: euler-hamilton.exam-pattern
concept_id: euler-hamilton
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.50
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT/MCQ Euler questions reduce to one count: how many odd-degree vertices does the graph have.** $0$ means circuit, $2$ means path (not circuit), anything else means neither — no tracing or construction needed to answer.

  Example: $K_{3,3}$ has all six vertices at degree $3$ — six odd-degree vertices, so no Eulerian circuit and no Eulerian path exist, decided purely from the degree list.

- **Hamiltonian questions on GATE rarely ask you to prove non-existence for a general graph** (that's the NP-complete direction) — they ask you to exhibit one circuit on a small, explicitly drawn graph, or to apply Dirac's/Ore's sufficient condition as a quick MCQ check.

  Same $K_{3,3}$: minimum degree $3$ meets Dirac's threshold $\deg\geq n/2=3$ for $n=6$, so a Hamiltonian circuit is guaranteed — and one exists directly, e.g. alternating between the two vertex classes.

- **MSQ questions test the sufficient-vs-necessary distinction on Dirac/Ore directly** — expect one option correctly stating Dirac guarantees existence when its bound is met, and one incorrect option claiming failing Dirac proves no Hamiltonian circuit exists.

- **Time budget:** the Euler degree-parity check should take under 20 seconds regardless of graph size. A Hamiltonian-circuit construction on a small drawn graph (under 8 vertices) should stay under two minutes — start from the vertex with fewest options and backtrack once, rather than trying permutations blindly.
