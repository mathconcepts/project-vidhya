---
id: gauss-divergence.common-traps
concept_id: gauss-divergence
atom_type: common_traps
bloom_level: 2
difficulty: 0.3
exam_ids: ["*"]
---

- **Forgetting the normal direction**: Gauss' Theorem requires the **outward** normal (pointing away from the volume). If you accidentally use an inward normal, the sign flips. **Always double-check orientation** before computing.

- **Computing flux directly without the theorem**: Novices try to parameterize all faces of a cube or integrate over a sphere surface directly. Experts recognize "closed surface" and immediately compute $\iiint_V \nabla \cdot \mathbf{F} \, dV$—often 50x faster.

- **Solenoidal fields forgotten**: If $\nabla \cdot \mathbf{F} = 0$ (solenoidal field), the flux through *any* closed surface is zero. This is a one-liner answer, not a complex integral. Magnetic fields ($\nabla \cdot \mathbf{B} = 0$) are the classic example.
