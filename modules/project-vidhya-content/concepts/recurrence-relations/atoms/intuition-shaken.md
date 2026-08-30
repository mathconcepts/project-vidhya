---
# Alternative body for recurrence-relations.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: recurrence-relations.intuition.shaken
concept_id: recurrence-relations
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: recurrence-relations.intuition
for_stance: shaken
---

Build a sequence by hand: $a_1=1$, then each next term doubles the one before and adds one — $a_2=2\cdot1+1=3$, $a_3=2\cdot3+1=7$, $a_4=2\cdot7+1=15$. Four terms, each one computed only from the term right before it — that is what a recurrence is: a rule reaching backward a fixed number of steps, not a direct formula for $a_n$.

Compare a rule using two steps back instead: $a_1=1,a_2=1$, then $a_n=a_{n-1}+a_{n-2}$, giving $a_3=2,a_4=3,a_5=5$. How many steps a rule reaches back is its order — one step back above, two steps back here.

A recurrence with no extra added term, like both of these, is homogeneous; one with an extra piece depending on $n$ alone, tacked onto the end, is non-homogeneous. Either way, the rule by itself isn't enough — the starting values, $a_1$ alone or $a_1$ and $a_2$ together, have to be fixed too, or the same rule would describe infinitely many different sequences.

The rule alone never pins down one sequence; the starting values are what make it unique.
