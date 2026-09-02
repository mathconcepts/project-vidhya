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

**Worked check:** $\int4x^3\cos(x^4)\,dx$. The inner piece is $x^4$; its shadow (derivative) is $4x^3$ — sitting right there as the other factor. Let $u=x^4$, $du=4x^3\,dx$: $\int\cos u\,du=\sin u+C=\sin(x^4)+C$. Differentiate back: $\cos(x^4)\cdot4x^3$. Matches exactly.

**Sanity-check reflex:** after substituting, the integral should be entirely in terms of $u$ — no stray $x$ left over. A leftover $x$ means either the shadow wasn't a clean match, or a conversion step was skipped.
