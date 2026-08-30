---
# Alternative body for euler-hamilton.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: euler-hamilton.intuition.assured
concept_id: euler-hamilton
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: euler-hamilton-intuition
for_stance: assured
---

The trap: Dirac ($\delta(G)\geq n/2$) and Ore ($\deg u+\deg v\geq n$ for nonadjacent $u,v$) are sufficient for a Hamiltonian circuit, never necessary. $C_n$ for $n\geq 5$ is itself a Hamiltonian circuit with $\delta(G)=2 \ll n/2$ — both theorems fail to apply, and the circuit exists anyway. Never conclude non-existence from a failed sufficient condition; only a direct argument (a cut vertex, an independent set larger than $n/2$) can rule a Hamiltonian circuit out.

Eulerian existence is genuinely different in kind: it's an iff, not a bound. Undirected: connected plus all-even degree gives a circuit; connected plus exactly two odd gives a path, endpoints forced to the two odd vertices. Directed: strongly connected plus $\deg^+(v)=\deg^-(v)$ everywhere gives a circuit; exactly one vertex with out-in $=1$ and one with in-out $=1$ (rest balanced) gives a path — get the direction of the imbalance backwards and you've swapped the start and end vertex.

$K_n$ has an Eulerian circuit iff $n$ is odd, since $\deg(v)=n-1$ must be even. A Hamiltonian circuit exists in $K_n$ for every $n\geq 3$ — the two properties don't move together.
