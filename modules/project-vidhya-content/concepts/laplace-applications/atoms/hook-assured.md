---
# Alternative body for laplace-applications.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: laplace-applications.hook.assured
concept_id: laplace-applications
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: laplace-applications.hook
for_stance: assured
---

The initial conditions folding in for free is exactly where a rushed transform loses a mark: $y'(t)\to sY(s)-y(0)$ is correct only for the *first* derivative applied to a nonzero $y(0)$ — a second derivative needs $s^2Y(s)-sy(0)-y'(0)$, and dropping the $-sy(0)$ term (not just $-y'(0)$) is the version of this mistake that produces an almost-right answer.
