---
# Alternative body for graph-connectivity.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: graph-connectivity.hook.shaken
concept_id: graph-connectivity
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: graph-connectivity.hook
for_stance: shaken
---

Take 4 nodes in a line: $A$–$B$–$C$–$D$. Cut edge $B$–$C$ and the graph splits into two pieces. Now take a 4-cycle $A$–$B$–$C$–$D$–$A$ instead and cut any one edge: the other three still connect every node. Same act, one edge removed, opposite result — the cycle had a second route.
