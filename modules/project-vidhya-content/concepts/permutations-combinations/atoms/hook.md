---
id: permutations-combinations.hook
concept_id: permutations-combinations
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

A school WiFi router needs a 4-digit PIN from digits $0$-$9$, with **no digit repeated**. How many different PINs are even possible, before anyone tries to guess one?

The first digit has $10$ choices. Once picked, only $9$ digits remain for the second position, then $8$ for the third, then $7$ for the fourth. Multiply the choices at each independent step: $10 \times 9 \times 8 \times 7 = 5040$ possible PINs.

Notice what mattered: **order**. PIN $1234$ and PIN $4321$ use the same four digits but are completely different PINs. Counting problems where order matters are **permutations** — and this multiply-the-choices idea, the **fundamental counting principle**, drives almost every formula that follows.
