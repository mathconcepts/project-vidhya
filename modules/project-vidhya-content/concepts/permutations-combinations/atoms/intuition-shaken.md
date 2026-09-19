---
id: permutations-combinations.intuition-shaken
concept_id: permutations-combinations
atom_type: intuition
variant_of: permutations-combinations.intuition
for_stance: shaken
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

A wardrobe has $4$ shirts and $3$ trousers. Pick a shirt: $4$ ways. Independently pick trousers: $3$ ways. Total outfits: $4 \times 3 = 12$. This multiplying-choices idea is the **fundamental counting principle**.

Now pick $3$ friends out of $5$ for a movie: the *group* $\{A,B,C\}$ is one single outcome — order inside the group does not matter. That is a **combination**.

Instead, seat those same $3$ friends in $3$ specific numbered seats of a car: now $\{A,B,C\}$ in seat order $(A,B,C)$ is different from $(B,A,C)$. Same $3$ people, but $3! = 6$ different seatings exist for every one group. That is a **permutation**.

For repeated letters in a word, divide out the repeats — treating them as distinct overcounts. For "items together", glue them into one block first, then arrange inside. For splitting into equal, unlabeled groups, divide by the number of ways to reorder the groups themselves.
