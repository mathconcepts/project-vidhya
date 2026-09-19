---
id: permutations-combinations.worked-example-shaken
concept_id: permutations-combinations
atom_type: worked_example
variant_of: permutations-combinations.worked-example
for_stance: shaken
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** How many distinct arrangements of ARRANGE are there (a) in total, and (b) with all vowels together?

---

**Step 1 — List the letters and count each one.** A-R-R-A-N-G-E: $7$ letters. A appears twice. R appears twice. N, G, E each appear once.

---

**Step 2 — Start with all $7$ treated as distinct.** $7! = 7\times6\times5\times4\times3\times2\times1 = 5040$.

---

**Step 3 — Remove the overcounting from the repeats.** Swapping the two A's changes nothing visible, and neither does swapping the two R's. Divide by $2!$ once for A, once for R: $\dfrac{5040}{2\times2} = \dfrac{5040}{4} = 1260$ total arrangements.

---

**Step 4 — For part (b), glue A, A, E into one block.** Now count units: the block, plus R, R, N, G — that's $5$ units.

---

**Step 5 — Arrange these $5$ units, dividing for the repeated R.** $\dfrac{5!}{2!} = \dfrac{120}{2} = 60$.

---

**Step 6 — Arrange inside the vowel block.** A, A, E has $3$ letters, A repeated: $\dfrac{3!}{2!} = \dfrac{6}{2} = 3$ ways.

---

**Step 7 — Multiply the two independent counts.** $60 \times 3 = 180$.

$$\boxed{\text{Total: } 1260, \quad \text{Vowels together: } 180}$$
