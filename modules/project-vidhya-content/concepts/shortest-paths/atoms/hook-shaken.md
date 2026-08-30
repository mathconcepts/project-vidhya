---
# Alternative body for shortest-paths.hook, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: shortest-paths.hook.shaken
concept_id: shortest-paths
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: shortest-paths.hook
for_stance: shaken
---

A city map: $A\to B$ costs $4$, $A\to C$ costs $2$, $C\to B$ costs $1$. Direct route $A\to B$: cost $4$. Route through $C$: $2+1=3$. Cheaper. Checking every route by hand doesn't scale past a few cities; a fast algorithm finds this in one pass.
