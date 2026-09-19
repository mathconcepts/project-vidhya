---
id: probability-jee.micro-exercise
concept_id: probability-jee
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
---

**A fair coin is tossed $4$ times. What is the probability of getting exactly $2$ heads?**

(A) $1/4$
(B) $3/8$
(C) $1/2$
(D) $3/16$
(E) $5/16$

<details>
<summary>Answer</summary>

**Correct answer: (B).**

**Reasoning**: this is binomial with $n=4$, $p=1/2$, and $r=2$ successes (heads). The four tosses are identical and independent, and $p$ never changes — the formula genuinely applies here.

$$P(X=2)=\binom{4}{2}\left(\dfrac12\right)^2\left(\dfrac12\right)^2=6\times\dfrac{1}{16}=\dfrac{6}{16}=\dfrac{3}{8}$$

Option (D), $3/16$, is the trap for a student who forgets to multiply by $\binom{4}{2}=6$ and instead only computes $(1/2)^4=1/16$, then makes an unrelated arithmetic slip. Option (E), $5/16$, comes from using $\binom{4}{2}=5$ by mistake (confusing it with $\binom{5}{2}$ or a miscount). Option (C) is the probability of at least one head or tail pattern, not this specific count.

</details>
