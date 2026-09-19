---
id: permutations-combinations.intuition
concept_id: permutations-combinations
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

The **fundamental counting principle** is multiplication in disguise: if one step can be done in $m$ ways and a second, independent step in $n$ ways, both together happen in $m \times n$ ways. Getting dressed is exactly this — $4$ shirts, $3$ trousers, independently chosen, gives $4\times3=12$ outfits.

**Permutations** count arrangements where order matters — who sits in which seat, which digit goes first. **Combinations** count selections where order does not matter — which three friends get picked, with no ranking among them. The same three friends chosen for a trip is one combination; assigning those same three friends to three named seats in a car is six different permutations of the identical group.

Items that repeat need care: arranging the letters of a word with repeated letters overcounts unless the repeats are divided out. **Restrictions** — some items forced together, or forced apart — are handled by treating "together" as a single block first, arranging inside it separately. **Grouping and distribution** problems split a set into smaller groups, dividing by group-size factorial whenever the groups are otherwise indistinguishable, to avoid counting the same split twice.
