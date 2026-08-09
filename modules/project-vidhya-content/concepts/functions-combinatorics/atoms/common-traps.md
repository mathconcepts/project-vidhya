---
id: functions-combinatorics.common-traps
concept_id: functions-combinatorics
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Confusing injective and surjective**: "Injective = one-to-one" (no collisions in output), while "surjective = onto" (every output is covered). A helpful mnemonic: **"Injective = INTO (each input goes into a distinct output)"** and **"Surjective = ONTO (covers all of the target set)"**.
- **Misapplying the binomial coefficient formula**: Students compute $\binom{n}{k} = n \cdot k$ or forget to divide by $k!$ and $(n-k)!$. Always use: $\binom{n}{k} = \frac{n!}{k!(n-k)!}$.
- **Treating identical and distinct objects interchangeably**: Permutations count ordered arrangements of distinct objects. Combinations count unordered selections. Identical objects go with "stars and bars" (composition formula $\binom{n+k-1}{k-1}$), NOT permutations.
