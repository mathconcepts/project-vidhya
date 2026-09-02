---
# Alternative body for multivariable-calculus.intuition, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: multivariable-calculus.intuition.assured
concept_id: multivariable-calculus
atom_type: intuition
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
variant_of: multivariable-calculus.intuition
for_stance: assured
---

The gradient is perpendicular to the level curve through that point, never tangent to it — a level curve is where $f$ stays constant, so moving ALONG it produces zero directional derivative, while the gradient points in the direction of maximum change; these two directions are necessarily orthogonal. This is the fast route to a common GATE ask, "find the direction in which $f$ is unchanging at a point": it is exactly perpendicular to $\nabla f$ there, no optimization needed, since a direction along the level curve is defined by that zero-change property, not by trying directions.
