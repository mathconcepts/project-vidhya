---
# Alternative body for euler-hamilton.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: euler-hamilton.hook.assured
concept_id: euler-hamilton
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: euler-hamilton.hook
for_stance: assured
---

Eulerian existence is a parity count: 0 odd-degree vertices gives a circuit, exactly 2 gives a path, anything else gives neither — decidable in $O(V+E)$ regardless of graph size. Hamiltonian existence has no analogous count. Dirac's and Ore's degree thresholds are sufficient, never necessary; failing them proves nothing about whether a Hamiltonian circuit exists. The trap is treating a Hamiltonian question as if it collapsed to a degree check the way the Eulerian one does — it doesn't, and no polynomial-time characterization is known, because the problem is NP-complete.
