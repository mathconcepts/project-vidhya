---
id: derivatives-basic.mnemonic
concept_id: derivatives-basic
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**The elevator rule.** For $\frac{d}{dx}x^n$: the exponent takes the elevator down — becoming the multiplier out front — and then takes one more step down itself. $n$ goes from upstairs to downstairs, and loses one floor on the way: $x^n \to n\,x^{n-1}$.

**Worked micro-example:** $\dfrac{d}{dx}\left(x^6\right) = 6x^5$ — the $6$ rides down as a coefficient, the exponent lands on $5$.

**Each term is its own island.** The sum rule means every term in a polynomial differentiates on its own — nothing from one term leaks into another, and a constant term's floor is already at zero, so it has nowhere left to go: it vanishes.

**Sanity-check reflex:** after differentiating, check that the new exponent is exactly one less than the old one on every power term, and that the function's degree dropped by exactly one. A degree that didn't drop signals a forgotten step, not a shortcut.
