---
id: gauss-divergence.mnemonic
concept_id: gauss-divergence
atom_type: mnemonic
bloom_level: 2
difficulty: 0.7
exam_ids: ["*"]
modality: mnemonic
---

**"Sealed box, easy swap."** Gauss' Theorem only trades a surface integral for a volume integral when the surface is **closed** — sealed shut, no gaps — because only a sealed surface actually encloses a volume to swap it for.

**C-O-V, in order:** the surface must be **C**losed; the normal must point **O**utward; then the flux equals the **V**olume integral of divergence — with no restriction at all on the surface's shape.

**Worked micro-example.** For $\mathbf F=(x,y,z)$: $\operatorname{div}\mathbf F=3$. Over the cube $[-1,1]^3$ (volume $8$, no sphere required), the flux is $3\times8=24$ — the same shortcut works for a box exactly as it does for a sphere.

**Sanity-check reflex:** before trusting a flux answer, check that the surface really is sealed shut — an open hemisphere with no flat cap is not a legal input to Gauss' Theorem, however tempting the shortcut looks.
