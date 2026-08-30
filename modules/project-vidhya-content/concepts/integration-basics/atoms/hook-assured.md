---
# Alternative body for integration-basics.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: integration-basics.hook.assured
concept_id: integration-basics
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: integration-basics.hook
for_stance: assured
---

GATE's giveaway phrasing is "find $f(x)$ given $f'(x)=\dots$" — an antiderivative question dressed as reverse differentiation. The reflex mistake: naming *one* antiderivative and stopping, when the true answer is an entire family differing by a constant, $F(x)+C$. Dropping $C$ costs the mark on any question that later pins the constant down with an initial condition, since there is nothing left to solve for once it's gone.
