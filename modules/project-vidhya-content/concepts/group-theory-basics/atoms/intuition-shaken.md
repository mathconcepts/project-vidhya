---
# Alternative body for group-theory-basics.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: group-theory-basics.intuition.shaken
concept_id: group-theory-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["gate-ma"]
scaffold_fade: 0
variant_of: group-theory-basics-intuition
for_stance: shaken
---

Take $(\mathbb{Z}_4,+_4) = \{0,1,2,3\}$ with addition mod $4$. Check closure on one pair: $2+3=5$, and $5\bmod4=1$, still in the set. Check associativity on numbers: $(1+2)+3=3+3=6\equiv2$, and $1+(2+3)=1+5=6\equiv2$ — same answer either order. Check identity: $0+3=3$ and $3+0=3$, so $0$ does nothing. Check inverses one element at a time: $1+3=4\equiv0$, so $3$ undoes $1$; $2+2=4\equiv0$, so $2$ undoes itself. All four properties held — closure, associativity, an identity, and an inverse for every element — and that full list, together, is what makes $(\mathbb{Z}_4,+_4)$ a group.

Every element of $\mathbb{Z}_4$ is a repeated sum of $1$: $1,\,1+1=2,\,1+1+1=3,\,1+1+1+1=0$. That makes $1$ a generator, and $\mathbb{Z}_4$ a cyclic group.

Now the order of an element: how many times you add it to itself before landing back on $0$. For $2$: $2,\,2+2=0$ — two steps, so $\text{ord}(2)=2$. For $1$: four steps, $\text{ord}(1)=4$.

Subgroups of $\mathbb{Z}_4$: $\{0\}$, $\{0,2\}$, and the whole group — sizes $1,2,4$, each dividing $4$. No subgroup of size $3$ exists, because $3$ doesn't divide $4$. Every subgroup's size divides the group's size, and that division is worth checking before attempting to build a subgroup of a given size at all.
