---
id: divergence-curl.mnemonic
concept_id: divergence-curl
atom_type: mnemonic
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: mnemonic
---

**"DIV spreads, CURL spins."** Divergence measures whether a small balloon dropped at a point inflates or shrinks; curl measures whether a small paddle wheel dropped at the same point turns. Neither picture needs the other to make sense.

**The two-identity chain, remembered as "grad can't spin, curl can't leak":**

$$\operatorname{curl}(\nabla\phi)=\mathbf 0 \qquad \operatorname{div}(\operatorname{curl}\mathbf F)=0$$

Worked micro-example: for $\phi=xyz$, $\nabla\phi=(yz,xz,xy)$. Compute $\operatorname{curl}(\nabla\phi)$ directly: the first component is $\partial_y(xy)-\partial_z(xz)=x-x=0$, and the other two vanish the same way by the pattern — confirming "grad can't spin" rather than assuming it.

**Sanity-check reflex:** whenever a computed curl of a gradient field comes out nonzero, or a computed divergence of a curl comes out nonzero, the algebra has an error — these two are never approximately zero, only exactly zero.
