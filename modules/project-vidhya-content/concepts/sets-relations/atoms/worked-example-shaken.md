---
# Alternative body for sets-relations.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: sets-relations.worked_example.shaken
concept_id: sets-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["gate-ma"]
scaffold_fade: 1
variant_of: sets-relations-worked-example
for_stance: shaken
---

$100$ students, $60$ take Math, $45$ take Physics, $30$ take both. How many take neither?

Apply inclusion-exclusion: $|M\cup P|=|M|+|P|-|M\cap P|=60+45-30=75$.

Subtract from the total: $100-75=25$ take neither.

Second question: is $aRb\Leftrightarrow3\mid(a-b)$ an equivalence relation on $\mathbb{Z}$? Reflexivity: $a-a=0$, and $3\mid0$, so $aRa$ for every $a$. Symmetry: if $3\mid(a-b)$ then $a-b=3k$, so $b-a=3(-k)$, still divisible by $3$. Transitivity: if $a-b=3k$ and $b-c=3m$, then $a-c=3(k+m)$, divisible by $3$. All three hold — equivalence relation, classes $[0],[1],[2]$ partitioning $\mathbb{Z}$.

Third question: how many reflexive relations exist on a $4$-element set? Total pairs: $|A\times A|=16$. Reflexive forces all $4$ diagonal pairs in. Free pairs left: $16-4=12$. Each is independently in or out: $2^{12}$.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: inclusion-exclusion and an equivalence relation proof","steps":[{"prompt":"In a survey of 200 people, 120 like tea, 80 like coffee, and 40 like both. How many like neither? Write your answer as a number.","hint":"Use inclusion-exclusion: |T∪C| = |T| + |C| - |T∩C|. Then subtract from 200.","answer":"40"},{"prompt":"Is the relation R on ℤ defined by aRb ⟺ a·b > 0 an equivalence relation? If not, which property fails? (Write: yes / reflexivity fails / symmetry fails / transitivity fails)","hint":"Check reflexivity first: does 0R0 hold? Is 0·0 = 0 > 0?","answer":"reflexivity fails"}]}
```

Each of the twelve free pairs doubles the count independently — that is where the power of two comes from.
