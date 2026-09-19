---
id: permutations-combinations.worked-example
concept_id: permutations-combinations
atom_type: worked_example
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** How many distinct arrangements of the letters of the word **ARRANGE** are there (a) in total, and (b) with all the vowels together?

---

**Step 1 — Count the letters and spot the repeats.** ARRANGE has $7$ letters: A, R, R, A, N, G, E. The letter A repeats twice, and R repeats twice; N, G, E each appear once.

---

**Step 2 — Total arrangements, dividing out the repeats.** Treating all $7$ letters as distinct would give $7!$ arrangements, but that overcounts, since swapping the two A's (or the two R's) with each other produces an arrangement that looks identical. Divide by $2!$ for each repeated letter: $\dfrac{7!}{2!\,2!} = \dfrac{5040}{4} = 1260$.

---

**Step 3 — For part (b), lock the vowels into one block.** The vowels are A, A, E — three letters, tied together as a single unit. The remaining letters are R, R, N, G — four letters, plus the vowel-block counts as one more unit, making $5$ units total.

---

**Step 4 — Arrange the $5$ units, accounting for the repeated R.** $\dfrac{5!}{2!} = \dfrac{120}{2} = 60$ ways to arrange (block, R, R, N, G).

---

**Step 5 — Arrange the vowels inside their own block.** The vowel-block itself is A, A, E — $3$ letters with A repeated: $\dfrac{3!}{2!} = 3$ internal arrangements.

---

**Step 6 — Multiply the two independent counts.** $\boxed{60 \times 3 = 180}$ arrangements with all vowels together — out of $1260$ total, confirming that keeping the vowels together is a real restriction, not most of the arrangements.
