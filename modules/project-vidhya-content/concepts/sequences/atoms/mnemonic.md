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

**Micro-example:** $a_n = 3 - \dfrac1n$. Bounded? Yes, $a_n < 3$ always. Monotonic? Yes, increasing (subtracting a shrinking positive number). BAM lands $\Rightarrow$ converges, and the algebra hands over the value: as $\dfrac1n\to0$, $a_n\to 3$.

**Sanity-check reflex:** whenever you're about to declare a sequence convergent, ask which half of BAM you actually verified. If you only checked boundedness, you have not finished — $(-1)^n$ passes that half and still diverges.
