---
id: binomial-theorem.hook-shaken
concept_id: binomial-theorem
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: binomial-theorem.hook
for_stance: shaken
---

Find the remainder when $7^{103}$ is divided by $25$. Start small: $7^2 = 49$. Note $49 = 50 - 1$, and $50$ is a multiple of $25$. So $7^{103} = 7\cdot(7^2)^{51} = 7\cdot(50-1)^{51}$.

Expand $(50-1)^{51}$ using the binomial theorem, one term at a time. Each term has the shape $\binom{51}{r}\,50^{51-r}(-1)^r$. Check the power of $50$ in each term: for $r=0,1,\dots,50$, the exponent $51-r$ is at least $1$, so that term is a multiple of $50$, hence a multiple of $25$. Only $r=51$ gives $50^0=1$, so only that one term survives the remainder. The rest of this concept builds up to solving this exact problem, step by step, in the worked example.
