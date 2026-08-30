---
# Alternative body for taylor-laurent.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: taylor-laurent.hook.assured
concept_id: taylor-laurent
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: taylor-laurent.hook
for_stance: assured
---

A Taylor series is a Laurent series whose principal part is identically zero — a special case, not a different object. The real trap: a Laurent expansion is tied to an **annulus**, and the same function has a different series in a different annulus around the same center. $\frac1{z-1}$ expanded around $0$ for $|z|>1$ is a legitimate Laurent series with infinitely many negative powers of $z$, even though $z=1$ is a simple pole with a one-term principal part when the series is centered *at* $1$ instead. Which annulus you're in changes the visible series, not the pole itself.
