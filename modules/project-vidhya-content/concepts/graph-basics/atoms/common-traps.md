---
id: graph-basics.common-traps
concept_id: graph-basics
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting the Handshaking Lemma**: Students often try to count edges as if each vertex "has its own edges"—forget that edges are shared. Always emphasize: each edge touches two vertices, so degree sum = 2 × edges.
- **Confusing directed vs. undirected degree**: In directed graphs, students forget to separate in-degree and out-degree. The formula $d^{in}(v) + d^{out}(v) \neq$ anything universal; only $\sum d^{in} = \sum d^{out} = |E|$ holds.
- **Odd degree parity trap**: A classic GATE gotcha—students don't remember that the number of odd-degree vertices must be even. They'll try to construct graphs that are impossible (e.g., exactly 3 vertices with odd degree), then get confused.
