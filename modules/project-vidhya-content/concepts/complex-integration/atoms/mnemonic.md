---
id: complex-integration.mnemonic
concept_id: complex-integration
atom_type: mnemonic
bloom_level: 2
difficulty: 0.2
exam_ids: ["*"]
modality: mnemonic
---

**"Nothing inside, nothing out."** If every singularity of $f$ sits outside a closed contour $C$, the integral is $0$ — nothing inside worth reporting, so nothing comes out.

**Worked micro-example.** $\oint_{|z|=1}e^z\,dz$: $e^z$ has no singularities anywhere, so certainly none inside $|z|=1$. Nothing inside — the integral is $0$, confirmed without touching a parametrization.

**Sanity-check reflex.** Before reaching for Cauchy's formula or the residue theorem, ask "is anything even inside this loop?" first — if the answer is no, the problem is already finished at $0$, and every formula afterward would just be extra work confirming the same thing.
