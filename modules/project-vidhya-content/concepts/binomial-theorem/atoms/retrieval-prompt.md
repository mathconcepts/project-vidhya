---
id: binomial-theorem.retrieval-prompt
concept_id: binomial-theorem
atom_type: retrieval_prompt
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
estimated_minutes: 3
retention_tags: ["general-term", "middle-term"]
---

From memory, before checking: find the middle term of $\left(x+\dfrac1x\right)^{10}$.

- **(A)** $252$
- **(B)** $210$
- **(C)** $120$
- **(D)** $45$

<details>
<summary>Answer</summary>

**A**. $n=10$ is even, so there are $n+1=11$ terms — an odd count, so exactly one middle term: the $\left(\frac{10}{2}+1\right) = 6$th term, i.e. $T_6$, which is $T_{r+1}$ for $r=5$.

$$T_6 = \binom{10}{5}x^{10-5}\left(\frac1x\right)^5 = \binom{10}{5}x^5x^{-5} = \binom{10}{5} = 252$$

The powers of $x$ cancel exactly at the middle term here — that is a feature of this particular expansion, not a rule that always happens.

</details>
