---
# Alternative body for graph-basics.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: graph-basics.hook.assured
concept_id: graph-basics
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: graph-basics.hook
for_stance: assured
---

Same abstraction, three domains: $G=(V,E)$ models a road network, a server topology, or a bond structure identically. The distinction worth marks isn't the domain — it's whether edges are ordered pairs (directed, $(u,v)\neq(v,u)$) or unordered ($\{u,v\}=\{v,u\}$), since every degree, handshaking, and connectivity argument downstream depends on which one you're in. Mixing the two silently is the error graders actually see, not a wrong drawing.
