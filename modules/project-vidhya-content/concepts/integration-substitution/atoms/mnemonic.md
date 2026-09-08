---
id: integration-substitution.mnemonic
concept_id: integration-substitution
atom_type: mnemonic
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: mnemonic
---

**"Spot the shadow."** The derivative of the inner function is that inner function's *shadow* — if you see it standing right next to a composite function, name the inner piece $u$ and the shadow becomes $du$.

**Worked check:** $\int2x\cos(x^2)\,dx$. The inner piece is $x^2$; its shadow (derivative) is $2x$ — sitting right there as the other factor. Let $u=x^2$, $du=2x\,dx$: $\int\cos u\,du=\sin u+C=\sin(x^2)+C$. Differentiate back: $\cos(x^2)\cdot2x$. Matches exactly.

**Sanity-check reflex:** after substituting, the integral should be entirely in terms of $u$ — no stray $x$ left over. A leftover $x$ means either the shadow wasn't a clean match, or a conversion step was skipped.
