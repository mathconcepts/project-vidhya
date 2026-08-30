---
# Alternative body for random-variables.hook, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: random-variables.hook.shaken
concept_id: random-variables
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: random-variables.hook
for_stance: shaken
---

Heads is heads — you can't average it. Call heads $1$ and tails $0$: now $E[X]=P(H)\cdot1+P(T)\cdot0=P(H)$. A fair coin gives $E[X]=0.5$, a number the words "heads" and "tails" alone could never produce. That relabeling — outcome to number — is the entire idea of a random variable.
