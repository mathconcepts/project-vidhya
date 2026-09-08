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

**Worked check:** $\dfrac1{x^2-1}=\dfrac1{(x-1)(x+1)}$ — the hook's own fraction. Cover $(x-1)$, evaluate $\dfrac1{x+1}$ at $x=1$: $\dfrac12$. Cover $(x+1)$, evaluate $\dfrac1{x-1}$ at $x=-1$: $\dfrac1{-2}=-\dfrac12$. So $\dfrac1{x^2-1}=\dfrac{1/2}{x-1}-\dfrac{1/2}{x+1}$ — the split cover-up reaches directly, no multiplying through needed.

**Sanity-check reflex:** add the pieces back over a common denominator; if you don't recover the original fraction exactly, one cover-up substitution was evaluated at the wrong root.
