---
# Alternative body for sets-relations.worked_example, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: sets-relations.worked_example.assured
concept_id: sets-relations
atom_type: worked_example
bloom_level: 3
difficulty: 0.4
exam_ids: ["gate-ma"]
scaffold_fade: 1
variant_of: sets-relations-worked-example
for_stance: assured
---

Neither-count is inclusion-exclusion then complement, in one line: $100-(60+45-30)=25$. The trap isn't the arithmetic, it's forgetting the subtraction after the union — reporting $75$ instead of $100-75$.

Equivalence proof for $aRb\Leftrightarrow3\mid(a-b)$: reflexive from $3\mid0$, symmetric from $a-b=3k\Rightarrow b-a=3(-k)$, transitive from summing $a-b=3k,\,b-c=3m$. All three needed together — two out of three proves nothing, since a relation can be reflexive and transitive while failing symmetric (a partial order does exactly that), and the classification hinges on all three holding.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: inclusion-exclusion and an equivalence relation proof","steps":[{"prompt":"In a survey of 200 people, 120 like tea, 80 like coffee, and 40 like both. How many like neither? Write your answer as a number.","hint":"Use inclusion-exclusion: |T∪C| = |T| + |C| - |T∩C|. Then subtract from 200.","answer":"40"},{"prompt":"Is the relation R on ℤ defined by aRb ⟺ a·b > 0 an equivalence relation? If not, which property fails? (Write: yes / reflexivity fails / symmetry fails / transitivity fails)","hint":"Check reflexivity first: does 0R0 hold? Is 0·0 = 0 > 0?","answer":"reflexivity fails"}]}
```

Reflexive relations on a $4$-set: the diagonal is forced ($4$ pairs), the remaining $16-4=12$ pairs are each free, giving $2^{12}$ — not $2^{16}$, which counts all relations with no reflexivity constraint at all, and not $4^4$, which counts functions, not subsets of pairs at all.
