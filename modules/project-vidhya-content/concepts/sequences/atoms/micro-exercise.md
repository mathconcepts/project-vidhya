---
id: sequences.micro_exercise
concept_id: sequences
atom_type: micro_exercise
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
estimated_minutes: 2
---

Does $a_n = \dfrac{(-1)^n}{n}$ converge? If so, to what limit?

<details><summary>Answer</summary>Yes — despite the alternating sign, $-\dfrac1n \le a_n \le \dfrac1n$ for every $n$, and both bounds $\to 0$. By the squeeze theorem, $a_n \to 0$. Oscillating sign is fine as long as the magnitude itself shrinks to zero.</details>
