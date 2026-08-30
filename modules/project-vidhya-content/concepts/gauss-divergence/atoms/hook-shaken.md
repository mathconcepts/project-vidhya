---
# Alternative body for gauss-divergence.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: gauss-divergence.hook.shaken
concept_id: gauss-divergence
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: gauss-divergence.hook
for_stance: shaken
---

Seal a unit cube around the origin. To find the flux of $\mathbf F=(x,y,z)$ out through it directly, add up six separate face integrals, one per face, each with its own normal direction. That is the direct route: patrol the whole boundary, patch by patch, before any shortcut enters.
