---
id: permutations-combinations.hook-assured
concept_id: permutations-combinations
atom_type: hook
variant_of: permutations-combinations.hook
for_stance: assured
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

Getting $10\times9\times8\times7=5040$ for a no-repeat PIN is only step one. Step two, the one JEE actually tests: if repetition **were** allowed, the count is not $5040$ but $10^4=10000$ — a genuinely different rule.

Repetition resets every step's choice count back to the full $10$, since nothing is "used up" — positions two, three, four each still have all ten digits available. Reading a problem as "no repetition" when it actually allows repeats, or the reverse, silently swaps $^nP_r$-style counting for $n^r$-style counting, and the two answers differ by a large factor. "Digits may be repeated" or its absence is the entire fork — check it before writing a single number down.
