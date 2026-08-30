---
# Alternative body for graph-coloring.hook, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: graph-coloring.hook.assured
concept_id: graph-coloring
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: graph-coloring.hook
for_stance: assured
---

The chromatic number $\chi(G)$ equals 2 iff $G$ is bipartite — no odd cycle. Every other graph needs $\chi(G)\geq 3$, and NP-completeness lives in the gap between that lower bound and the true value once no small forced substructure pins it down. The trap: greedy gives $\chi(G)\leq\Delta+1$, and Brooks' theorem tightens this to $\chi(G)\leq\Delta$ for everything except complete graphs and odd cycles, where $\chi(G)=\Delta+1$ instead. Miss that exception on an odd cycle and you'll undercount by exactly one color, every time.
