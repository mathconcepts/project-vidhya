---
id: graph-basics.exam-pattern
concept_id: graph-basics
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.30
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions want a single number from a degree sequence or a partial edge list** — total edges given the degrees, a missing degree given the rest, or the degree of one vertex from an adjacency description. The handshaking lemma answers all three: sum the knowns, halve for edges, or reverse the arithmetic to isolate the missing term.

  Example: a graph on 6 vertices has degree sequence $(3,3,2,2,1,1)$. Sum $=12$, so $|E|=6$ — a 10-second NAT answer once the lemma is the reflex, not a from-scratch count.

- **MCQ "which sequence is impossible" questions test parity, not construction.** A sequence summing to an odd number is disqualified immediately — no graph realizes it. Don't attempt to sketch vertices and edges to check; the sum alone settles it.

- **MSQ "select all true statements" options mix loops, multigraphs, and simple graphs on purpose.** Expect one option about a loop's degree contribution (2, not 1), one about maximum degree in a simple graph ($n-1$, never $n$), and one about parallel edges inflating degree without adding neighbors.

- **Time budget:** a degree-sequence NAT question should cost under 30 seconds once you sum and halve. A "which sequence is graphical" MCQ needs the parity check first (instant disqualification) before reaching for anything heavier like Erdős–Gallai.
