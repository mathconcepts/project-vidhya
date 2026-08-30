---
# Alternative body for graph-coloring.hook, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: graph-coloring.hook.shaken
concept_id: graph-coloring
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: graph-coloring.hook
for_stance: shaken
---

Take a 5-cycle: five regions in a ring, each touching its two neighbors. Color region 1 red, region 2 blue, alternating — region 5 comes out red too, next to region 1. Conflict. Two colors fail; a third color for region 5 fixes it. Five regions, three colors, no way with two.
