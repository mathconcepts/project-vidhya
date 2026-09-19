---
id: permutations-combinations.intuition-assured
concept_id: permutations-combinations
atom_type: intuition
variant_of: permutations-combinations.intuition
for_stance: assured
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
---

The counting principle, and the permutation-versus-combination split, are settled ground by this point. Here is where a confident answer still goes wrong: "at least one" restrictions cannot be counted the same way "all together" restrictions are — trying it directly usually double-counts.

Consider selecting a committee of $3$ from $5$ boys and $4$ girls, with "at least one girl". A tempting direct approach: count committees with exactly $1$ girl, plus exactly $2$ girls, plus exactly $3$ girls, and add them — this actually works, but only because the three cases are genuinely disjoint (a committee cannot have exactly $1$ girl and exactly $2$ girls simultaneously). The much faster route exploits the same disjointness from the other side: total committees minus committees with **zero** girls, $^9C_3 - {^5C_3}$, is one subtraction instead of three additions. Both are correct; the second is what "at least" should trigger by reflex, since the complement (the one case that fails the condition) is almost always smaller and cleaner to count than every case that satisfies it.
