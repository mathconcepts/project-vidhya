---
id: gram-schmidt.interleaved-drill
concept_id: gram-schmidt
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: gram-schmidt.micro-exercise
---

**Cross-concept check: Gram-Schmidt → orthogonality.**

Running Gram-Schmidt on $v_1=(1,0,1)$, $v_2=(1,1,0)$ stops after one step at $u_1=(1,0,1)$, $u_2=\left(\tfrac12,1,-\tfrac12\right)$ (verified: this is the un-normalized output of the process, before dividing by norms).

**Question 1 (Gram-Schmidt):** Is $\{u_1,u_2\}$ orthogonal?

*Answer:* Yes — $u_1\cdot u_2 = \tfrac12+0-\tfrac12=0$, exactly as the process guarantees, with no dependence on whether the vectors are normalized.

**Question 2 (orthogonality):** Is $\{u_1,u_2\}$ *orthonormal*?

*Answer:* No. $\|u_1\|=\sqrt2\neq1$ and $\|u_2\|=\sqrt{\tfrac32}\neq1$. Orthogonal only requires the dot products to vanish; orthonormal additionally requires every vector to have unit length. Dividing each by its own norm — $e_1=u_1/\sqrt2$, $e_2=u_2/\sqrt{3/2}$ — reaches orthonormal without disturbing the dot-product-zero property already established, since scaling a vector never changes which direction it points.

**Why this drill exists:** "orthogonal" and "orthonormal" get used interchangeably in casual reading, and a question that asks specifically for one when a student has only checked the other loses marks on a property that was one division away from being satisfied. Gram-Schmidt's raw output is orthogonal by construction; orthonormal is a separate, final normalizing step.
