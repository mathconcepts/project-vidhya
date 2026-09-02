---
id: partial-fractions.mnemonic
concept_id: partial-fractions
atom_type: mnemonic
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: mnemonic
---

**"Cover it, plug it."** For a distinct linear factor $(x-a)$: cover that factor in the original fraction's denominator, then substitute $x=a$ into whatever remains — that number is the constant sitting over $(x-a)$.

**Worked check:** $\dfrac1{(x-2)(x+3)}$. Cover $(x-2)$, evaluate $\dfrac1{x+3}$ at $x=2$: $\dfrac15$. Cover $(x+3)$, evaluate $\dfrac1{x-2}$ at $x=-3$: $\dfrac1{-5}=-\dfrac15$. So $\dfrac1{(x-2)(x+3)}=\dfrac{1/5}{x-2}-\dfrac{1/5}{x+3}$.

**Sanity-check reflex:** add the pieces back over a common denominator; if you don't recover the original fraction exactly, one cover-up substitution was evaluated at the wrong root.
