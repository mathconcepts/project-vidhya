---
# Alternative body for functions-combinatorics.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: functions-combinatorics.intuition.shaken
concept_id: functions-combinatorics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["gate-ma"]
scaffold_fade: 0
variant_of: functions-combinatorics-intuition
for_stance: shaken
---

Let $A=\{1,2\}$ and $B=\{a,b,c\}$. List every function from $A$ to $B$ by hand — pick $f(1)$ three ways, then $f(2)$ three ways, giving nine functions total. Check each one: does any output repeat for two different inputs? $f(1)=a, f(2)=a$ repeats $a$ — not injective. $f(1)=a, f(2)=b$ never repeats an output — injective. None of the nine hit every element of $B$, since three inputs would be needed to cover three outputs, so none are surjective, and none are bijective either.

Now count without listing: arranging $3$ people in $3$ chairs gives $3!=6$ orders — write them out once to confirm, then trust the formula after that. Choosing $2$ people from $4$ for an unordered pair: list the six pairs $\{1,2\},\{1,3\},\{1,4\},\{2,3\},\{2,4\},\{3,4\}$ — six, matching $\binom{4}{2}=6$. The difference between the two counts is entirely about whether swapping two chosen items changes the answer.

Every ordered count is the unordered count times the number of ways to order what you picked: $P(n,r)=r!\cdot C(n,r)$.
