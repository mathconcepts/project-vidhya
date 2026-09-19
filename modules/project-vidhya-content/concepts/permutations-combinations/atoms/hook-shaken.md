---
id: permutations-combinations.hook-shaken
concept_id: permutations-combinations
atom_type: hook
variant_of: permutations-combinations.hook
for_stance: shaken
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

A WiFi PIN needs $4$ digits from $0$-$9$, no digit repeated. Fill the first position: $10$ digits are available, so $10$ choices.

Fill the second position: one digit is already used, so only $9$ remain. Fill the third: $8$ remain. Fill the fourth: $7$ remain.

Multiply all four numbers together: $10 \times 9 \times 8 \times 7$. Compute step by step: $10\times9=90$, $90\times8=720$, $720\times7=5040$.

So $5040$ different PINs exist. Order mattered the whole way through — PIN $1234$ is not the same as PIN $4321$, even though both use the same four digits. Counting where order matters is called a **permutation**.
