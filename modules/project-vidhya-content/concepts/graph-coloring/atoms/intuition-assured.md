---
# Alternative body for graph-coloring.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: graph-coloring.intuition.assured
concept_id: graph-coloring
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: graph-coloring.intuition
for_stance: assured
---

Brooks' theorem: $\chi(G)\leq\Delta(G)$ for every connected graph except complete graphs and odd cycles, where $\chi(G)=\Delta(G)+1$ instead. Miss the exception and you undercount an odd cycle by exactly one — $C_5$ has $\Delta=2$ but $\chi=3$, not $2$.

Vizing's theorem for edges runs the other way: $\chi'(G)\in\{\Delta(G),\Delta(G)+1\}$ always, no exceptions to memorize — the graph is Class 1 or Class 2, and telling which is itself NP-hard in general, unlike vertex coloring's clean exception list.

A clique of size $\omega$ forces $\chi(G)\geq\omega$ — a fast lower bound, since every pair in a clique is mutually adjacent and needs a distinct color. Squeeze it against the greedy upper bound $\chi(G)\leq\Delta(G)+1$: on $K_n$ they meet exactly ($\omega=\Delta+1=n$), but in general a gap remains that no bound closes — only inspecting the graph itself does.
