---
id: permutations-combinations.exam-pattern
concept_id: permutations-combinations
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How JEE actually asks this.**

- **MCQ: order matters or not?** Decide this before opening any formula. Words like "arrange", "form a number", "seat" signal a permutation; words like "select", "choose", "form a committee" signal a combination. Getting this one word wrong flips the entire approach.

- **NAT: stars-and-bars distribution.** "Identical objects into distinct boxes" (or "identical sweets among children") is a fixed cue for $^{n+r-1}C_{r-1}$ — do not attempt to enumerate cases by hand.

- **Trap: "at least" restrictions.** Compute the complement — total minus the forbidden case — rather than directly summing every case that satisfies "at least", which is slower and easier to miscount.

- **Trap: circular arrangements with extra symmetry.** A round-table seating uses $(n-1)!$; a necklace or bracelet arrangement (where flipping it over also looks the same) additionally divides by $2$, giving $\dfrac{(n-1)!}{2}$.

- **Time budget:** a fundamental-counting-principle NAT (independent choices multiplied together) should take under $30$ seconds — write down the number of choices at each stage and multiply; do not search for a named formula when direct multiplication already answers it.
