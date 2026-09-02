---
# Alternative body for counting-principles.intuition, served when the
# learner stance is `assured`. See src/content/stance-variants.ts.
#
# Terse, assumes the mechanics, spends its words on the one distinction
# that actually costs marks rather than re-teaching the base idea.
id: counting-principles.intuition.assured
concept_id: counting-principles
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: counting-principles.intuition
for_stance: assured
---

The tree picture collapses fast once items repeat. $C(n,r)=P(n,r)/r!$ divides out the overcounting from re-ordering $r$ *distinct* selected items — it does not apply when the items being arranged aren't all distinct. Arranging the letters of MISSISSIPPI isn't $11!$; it's $11!/(4!\,4!\,2!)$, dividing by the internal permutations of each repeated letter separately. Students who memorise "permutation = $n!$" apply it to multiset arrangements and overcount by exactly the product of those repeat factorials. Check for repeated elements before reaching for a bare factorial.
