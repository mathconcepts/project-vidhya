---
# Alternative body for graph-basics.intuition, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
id: graph-basics.intuition.assured
concept_id: graph-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.10
exam_ids: ["*"]
modality: visual
variant_of: graph-basics.intuition
for_stance: assured
---

The average-degree trap: given mean degree $\bar d$ over $n$ vertices, $|E| = \bar d \cdot n / 2$ — the same identity, rearranged. Forgetting the $/2$ doubles the edge count, an easy slip when a question states the average rather than the raw sum.

The same parity constraint flows in reverse too: a $k$-regular graph on $n$ vertices has $kn/2$ edges, which forces $kn$ to be even. If $k$ is odd, $n$ has to be even — a 3-regular graph on 5 vertices cannot exist, no matter how you try to draw it, since $3\times5=15$ is odd. The handshaking lemma refuses a degree sequence before you even attempt to construct it.
