---
id: sequences.mnemonic
concept_id: sequences
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"BAM" proves it exists: Bounded AND Monotonic.** Neither word alone is enough — that's the whole trap this topic sets, and "BAM" is a reminder that both have to land together before you get to claim convergence.

**Micro-example:** the same sequence from the hook, $a_n = \dfrac{2n+1}{n} = 2+\dfrac1n$. Bounded? Yes — $2 < a_n \le 3$ for every $n$. Monotonic? Yes, decreasing (subtracting a shrinking positive number, $\dfrac1n$, from a fixed $2$ means each term is a little smaller than the last). BAM lands $\Rightarrow$ converges, and the algebra hands over the value directly: as $\dfrac1n\to0$, $a_n\to 2$ — the same limit the hook already found by watching the numbers.

**Sanity-check reflex:** whenever you're about to declare a sequence convergent, ask which half of BAM you actually verified. If you only checked boundedness, you have not finished — $(-1)^n$ passes that half and still diverges.
