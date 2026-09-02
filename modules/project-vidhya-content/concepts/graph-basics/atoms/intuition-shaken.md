---
# Alternative body for graph-basics.intuition, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
id: graph-basics.intuition.shaken
concept_id: graph-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.10
exam_ids: ["*"]
modality: visual
variant_of: graph-basics.intuition
for_stance: shaken
---

Look at one vertex at a time in the graph: triangle $A$-$B$-$C$ plus $D$ attached to $A$.

$\deg(A)=3$ (edges to $B$, $C$, $D$). $\deg(B)=2$ (edges to $A$, $C$). $\deg(C)=2$ (edges to $A$, $B$). $\deg(D)=1$ (edge to $A$).

Add all four: $3+2+2+1=8$.

Now count the edges directly by listing them: $AB, BC, CA, AD$ — that's 4 edges.

Check: $8 = 2\times4$. Every edge got counted once at each end, so the degree total is always exactly double the edge count.
