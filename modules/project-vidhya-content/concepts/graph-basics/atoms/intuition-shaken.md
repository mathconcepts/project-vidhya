---
# Alternative body for graph-basics.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: graph-basics.intuition.shaken
concept_id: graph-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: graph-basics.intuition
for_stance: shaken
---

Take 4 vertices $A,B,C,D$ with edges $AB, AC, AD, BC$ — 4 edges. Vertex degrees: $A=3$ (touches $B,C,D$), $B=2$ (touches $A,C$), $C=2$ (touches $A,B$), $D=1$ (touches $A$).

Add the degrees: $3+2+2+1=8$. Now double the edge count: $2\times4=8$. Same number. That's the handshaking lemma — $\sum_v \deg(v)=2|E|$ — and it holds because every edge is counted from both ends: edge $AB$ adds $1$ to $A$'s degree and $1$ to $B$'s degree, so each edge contributes exactly $2$ to the total, no more, no less.

This graph is undirected: edge $AB$ is the same as edge $BA$, so it isn't double-counted as two separate connections. In a directed graph, $A\to B$ and $B\to A$ would be different edges, and you'd track in-degree and out-degree separately instead of one combined degree.

One use: if you're ever given 5 vertex degrees and the numbers add up to an odd total, stop — no such graph exists, because $2|E|$ is always even.
