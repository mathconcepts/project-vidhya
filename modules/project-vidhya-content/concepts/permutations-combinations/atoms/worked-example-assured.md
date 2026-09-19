---
id: permutations-combinations.worked-example-assured
concept_id: permutations-combinations
atom_type: worked_example
variant_of: permutations-combinations.worked-example
for_stance: assured
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
---

**Problem:** Arrangements of ARRANGE, (a) total, (b) all vowels together.

---

**Step 1 — Total.** $7$ letters, A and R each repeated twice: $\dfrac{7!}{2!\,2!} = 1260$.

---

**Step 2 — Vowels together.** Block A, A, E as one unit; arrange $5$ units (block, R, R, N, G) with R repeated: $\dfrac{5!}{2!}=60$. Arrange inside the block: $\dfrac{3!}{2!}=3$.

$$\boxed{60 \times 3 = 180}$$

---

**The distinction worth checking: "vowels together" is not the same restriction as "no two vowels adjacent".** The complementary restriction — no two vowels ever touching — is a genuinely different count, built by first arranging the $4$ consonants (R, R, N, G, giving $\dfrac{4!}{2!}=12$ ways) and then placing the $3$ vowels into the $5$ gaps created around and between them, choosing $3$ of those $5$ gaps and arranging the vowels in the chosen gaps: $^5C_3 \times \dfrac{3!}{2!} = 10\times3=30$, giving $12\times30=360$ total. "Together" glues items into a block; "never adjacent" places items into gaps — the two techniques share no steps, and reaching for the "together" block method on a "never adjacent" question answers a different problem than the one asked.
