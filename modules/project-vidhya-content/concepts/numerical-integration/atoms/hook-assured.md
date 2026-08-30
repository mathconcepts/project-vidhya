---
# Alternative body for numerical-integration.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-integration.hook.assured
concept_id: numerical-integration
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: numerical-integration.hook
for_stance: assured
---

Simpson's $O(h^4)$ label only holds when $f^{(4)}$ is continuous and bounded across $[a,b]$. Feed it a function with a kink inside the interval — $f(x)=|x|$ on $[-1,1]$, say — and the formula still runs and still returns a number, but the fourth-order guarantee is gone: the error now shrinks at whatever rate the kink allows, not the rate printed on the method's label.
