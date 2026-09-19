---
id: permutations-combinations.common-traps
concept_id: permutations-combinations
atom_type: common_traps
bloom_level: 4
difficulty: 0.45
exam_ids: ["*"]
---

- **Forgetting to divide out repeated letters or items**: treating every letter of a word as distinct and using $n!$ directly overcounts every arrangement that only differs by swapping two identical letters. Always check for repeats first, and divide by each repeated letter's own factorial.

- **Confusing "all together" with "at least one together"**: the block method (glue them into one unit) only works cleanly for "all together". "At least one" restrictions almost always need the complement — total minus the forbidden case — not a direct count.

- **Using $^nP_r$ where selection, not arrangement, was asked**: choosing a committee, or picking a set of books, has no internal order — that calls for $^nC_r$. Reach for $^nP_r$ only when the problem names distinct roles or positions (president, seat number, first prize).

- **Circular permutation slip**: using $n!$ instead of $(n-1)!$ for $n$ distinct people seated around a round table, forgetting that rotating everyone one seat over produces the "same" arrangement. If the problem additionally treats clockwise and counter-clockwise seatings as identical (like a necklace), divide by an extra $2$.

- **Skipping the group-order division in equal-group splits**: splitting $6$ people into two unlabeled groups of $3$ each needs an extra division by $2!$ — otherwise, group $\{A,B,C\}$/$\{D,E,F\}$ and group $\{D,E,F\}$/$\{A,B,C\}$ get counted as two different splits when they are really the same split.
