---
# Alternative body for graph-basics.worked-example, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
id: graph-basics.worked-example.assured
concept_id: graph-basics
atom_type: worked_example
bloom_level: 3
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: graph-basics.worked-example
for_stance: assured
---

**Problem:** Same graph — vertices $\{A,B,C,D,E\}$, edges $\{AB,AC,AD,BC,BD,CE\}$.

Read degrees straight off the edge list: $3,3,3,2,1$ for $A,B,C,D,E$. Sum $=12=2\times6=2|E|$ ✓. Four odd-degree vertices — even, as required.

$$\boxed{\sum\deg(v)=12,\quad 4\text{ odd-degree vertices}}$$

**Worth knowing for the harder version:** this check runs in reverse just as often. Given only a degree sequence with no edge list at all, $|E|$ is degree-sum$/2$ immediately — you never need to reconstruct which specific edges exist to answer an edge-count question. Reconstruction only matters if the question separately asks whether a valid graph exists for that sequence at all (Erdős–Gallai), which is a different and harder question than simply computing $|E|$.
