---
# Alternative body for graph-basics.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: graph-basics.intuition.assured
concept_id: graph-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: graph-basics.intuition
for_stance: assured
---

$\sum_v\deg(v)=2|E|$ is always even — a degree sequence summing to an odd number describes no graph, simple or not. That's the one-line feasibility check worth reaching for before anything else on a degree-sequence question.

Directed graphs split the lemma in two: $\sum_v \deg^+(v)=\sum_v\deg^-(v)=|E|$, each separately, not combined into one even total — a common slip is applying the undirected handshaking check to a directed degree list and rejecting a perfectly valid sequence.

Passing the sum-is-even test is necessary, not sufficient: $(3,3,3,1)$ sums to $10$ (even) but fails Erdős–Gallai at $k=2$ — $d_1+d_2=6$ exceeds the $5$ the bound allows there — so no simple graph realizes it. Handshaking only screens out the impossible half; Erdős–Gallai is the real gate.
