---
id: permutations-combinations.interleaved-drill
concept_id: permutations-combinations
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
modality: drill
tested_by_atom: permutations-combinations.micro-exercise
---

**Cross-concept check: permutations-combinations → binomial-theorem.**

**Question 1 (the same number, two different routes):** Find the coefficient of $x^2$ in the expansion of $(1+x)^5$, first by direct selection counting, then by expanding the binomial.

*Answer:* **Selection route:** the coefficient of $x^2$ counts the number of ways to pick $2$ of the $5$ factors of $(1+x)$ to contribute their $x$ (the rest contribute $1$) — that is exactly $^5C_2 = \dfrac{5!}{2!\,3!} = 10$, a pure combinations question with no algebra at all.

**Expansion route:** $(1+x)^5 = 1+5x+10x^2+10x^3+5x^4+x^5$. Reading off the $x^2$ term directly: coefficient $10$. Both routes agree.

**Question 2 (why they must agree):** Why is it not a coincidence that $^5C_2$ equals the coefficient of $x^2$ in $(1+x)^5$?

*Answer:* Expanding $(1+x)^5 = (1+x)(1+x)(1+x)(1+x)(1+x)$ by distributing means choosing, from each of the $5$ factors, either the "$1$" or the "$x$". An $x^2$ term is produced exactly when $2$ of the $5$ factors are chosen to contribute their $x$ — and the number of ways to choose which $2$ of the $5$ factors do that is, by definition, $^5C_2$. The binomial coefficient $^nC_r$ *is* a counting-combinations answer wearing algebra's clothing; it was never a separate, unrelated formula.

**Why this drill exists:** binomial coefficients are often memorised as "just a formula from Pascal's triangle" without ever being connected back to the selection-counting idea they came from — the two topics are the same fact, seen from two directions.
