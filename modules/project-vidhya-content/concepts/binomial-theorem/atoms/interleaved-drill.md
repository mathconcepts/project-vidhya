---
id: binomial-theorem.interleaved-drill
concept_id: binomial-theorem
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
modality: drill
tested_by_atom: binomial-theorem.micro-exercise
---

**Cross-concept check: binomial theorem → permutations and combinations.**

**Question 1 (binomial theorem):** Find the coefficient of $x^5$ in the expansion of $(1+x)^{12}$.

*Answer:* General term $T_{r+1}=\binom{12}{r}x^r$, so the coefficient of $x^5$ is $\binom{12}{5}$.

$$\binom{12}{5} = \frac{12!}{5!\,7!} = 792$$

**Question 2 (permutations and combinations):** A shelf has $12$ distinct books. In how many ways can you choose $5$ of them to take home, if the order you pick them in doesn't matter?

*Answer:* Choosing $5$ items out of $12$ with order irrelevant is exactly $\binom{12}{5} = 792$ — the same number as Question 1.

**Why this drill exists.** $\binom{n}{r}$ is not two different formulas that happen to look similar — it is one number doing two jobs. As a binomial coefficient, it counts how many ways to distribute $r$ copies of $b$ among $n$ factors of $(a+b)$. As a combinations count, it counts how many ways to choose $r$ items from $n$. The binomial theorem's expansion IS a counting argument in disguise: the coefficient of $a^{n-r}b^r$ is the number of ways to pick which $r$ of the $n$ factors contribute a $b$.
