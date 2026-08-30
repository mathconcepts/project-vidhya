---
# Alternative body for numerical-integration.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-integration.intuition.assured
concept_id: numerical-integration
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: numerical-integration-intuition
for_stance: assured
---

## Two conditions Simpson's rule needs, both easy to skip

Simpson's 1/3 rule needs $n$ even — it pairs nodes into groups of three, and an odd $n$ leaves one interval unpaired, breaking the formula outright rather than degrading it gracefully. Check parity before a single function value is computed.

The $O(h^4)$ error bound is a second, independent condition: it needs $f^{(4)}$ continuous and bounded on $[a,b]$. A kink, a discontinuity in a low derivative, or a singularity anywhere within $[a,b]$, and the fourth-order guarantee disappears — the formula still runs and still hands back a number, but that number now converges at whatever rate the actual smoothness allows.

Neither condition is optional, and both are checkable before touching a single node value: skip them and what you have is not a slightly worse estimate, it is a number carrying no stated accuracy at all.
