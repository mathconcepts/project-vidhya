---
# Alternative body for multiple-integrals.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multiple-integrals.hook.assured
concept_id: multiple-integrals
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: multiple-integrals.hook
for_stance: assured
---

GATE's giveaway is "set up the limits of integration" for a region that is not a rectangle — the actual test is describing the boundary correctly, not the integration mechanics, which are routine once the bounds are right. The reflex mistake: swapping the order of integration ($dx\,dy\to dy\,dx$) while keeping the *same numerical limits*. A non-rectangular region generally needs entirely different bounds re-derived from the boundary curves for the new order; reusing old limits under a swapped order integrates over the wrong shape entirely.
