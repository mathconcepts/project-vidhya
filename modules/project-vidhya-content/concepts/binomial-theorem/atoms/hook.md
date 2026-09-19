---
id: binomial-theorem.hook
concept_id: binomial-theorem
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
---

JEE sometimes asks something like this: what is the remainder when $7^{103}$ is divided by $25$? No calculator can hold a 103-digit number, and long division on it is out of the question. The binomial theorem cracks it in three lines. Rewrite $7^{103}$ as $7\cdot(7^2)^{51} = 7\cdot(50-1)^{51}$ — a deliberate choice, because $50$ is a multiple of $25$. Now expand $(50-1)^{51}$ term by term. Every term except the very last one carries a positive power of $50$, so it is a multiple of $25$ and vanishes when only the remainder matters. One expansion, one surviving term, and a monstrous power collapses into arithmetic you can finish in your head.
