---
id: surface-integrals.mnemonic
concept_id: surface-integrals
atom_type: mnemonic
bloom_level: 2
difficulty: 0.6
exam_ids: ["*"]
modality: mnemonic
---

**"Two tangents, one cross, one dot."** Differentiate the parametrization $\mathbf r(u,v)$ with respect to each parameter to get two tangent vectors, cross them to get a normal that already carries the area-scaling factor, then dot that normal against the field before integrating over the flat $(u,v)$ domain. Skipping straight to a dot product without crossing first is the shortcut that produces a number with no surface area baked into it at all.

**Worked micro-example:** $S:\mathbf r(u,v)=(u,v,u+v)$ for $(u,v)\in[0,1]\times[0,1]$, field $\mathbf F=(0,0,1)$. Tangents: $\mathbf r_u=(1,0,1)$, $\mathbf r_v=(0,1,1)$. Cross: $\mathbf r_u\times\mathbf r_v=(-1,-1,1)$. Dot: $\mathbf F\cdot(\mathbf r_u\times\mathbf r_v)=1$. Integrate over the unit square: flux $=1$.

**Sanity-check reflex:** before dotting, check the cross product's sign matches the stated orientation — a normal pointing the wrong way flips the final sign without changing a single digit of the arithmetic.
