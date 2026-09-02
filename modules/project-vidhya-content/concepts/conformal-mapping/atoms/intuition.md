---
id: conformal-mapping.intuition
concept_id: conformal-mapping
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
modality: visual
---

A **conformal mapping** preserves angles at every point, even while stretching different regions by different amounts. Formally, $f$ is conformal at $z_0$ if $f$ is **analytic** there and $f'(z_0)\neq0$: near $z_0$, $f$ acts as multiplication by $f'(z_0)$ — rotate by $\arg f'(z_0)$, scale by $|f'(z_0)|$, uniformly in every direction, which is exactly why angles between any two directions survive.

**Why it matters for GATE:** the Joukowski transformation $w=z+1/z$ maps circles to airfoil shapes — aeronautical engineers use it to compute lift and drag without solving the flow equations directly. In potential theory, conformal maps carry an odd-shaped boundary to a simple one (a disc), solve Laplace's equation there, and carry the answer back.

**Key insight:** conformal mappings are local similarities, not global ones — small regions rotate and scale uniformly, but critical points (where $f'(z_0)=0$) are exactly where that uniformity, and with it conformality, breaks down. "Prove this map is conformal" always means checking both analyticity and $f'\neq0$, never one alone.
