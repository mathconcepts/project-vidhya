---
id: definite-integrals.mnemonic
concept_id: definite-integrals
atom_type: mnemonic
bloom_level: 1
difficulty: 0.1
exam_ids: ["*"]
modality: mnemonic
---

**Big minus Small, drop the $+C$.** Whatever antiderivative you find for a definite integral, evaluate it at the top bound, then the bottom bound, and subtract — top minus bottom, never the other way round. The constant of integration is not worth writing: any $+C$ you'd add cancels the moment you subtract $F(a)+C$ from $F(b)+C$.

**Worked micro-example.** For $\int_1^3 2x\,dx$: antiderivative $x^2+C$. Big (top, $x=3$): $9+C$. Small (bottom, $x=1$): $1+C$. Subtract: $(9+C)-(1+C)=8$ — the $C$ vanished exactly as promised.

**Sanity-check reflex.** Before trusting a definite-integral answer, ask: did I subtract top minus bottom, in that order, and would the answer change if I'd kept a $+C$? If the second answer is yes, something was miscancelled.
