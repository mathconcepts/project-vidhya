---
# Alternative body for graph-basics.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, arithmetic done
# in full, explicit check at the end. No reassurance language, no mention of
# how the reader might be feeling.
id: graph-basics.hook.shaken
concept_id: graph-basics
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: graph-basics.hook
for_stance: shaken
---

Take a graph on 4 vertices with degrees $3, 1, 1, 1$. Add them: $3+1+1+1=6$. Divide by 2: $6/2=3$. This graph has exactly 3 edges — check it by drawing one center vertex with edges to each of the remaining three.

Every graph works this way: add every vertex's degree, divide by 2, get the edge count. Try it on any graph before reading further — sum the degrees, halve the result, that number is $|E|$.
