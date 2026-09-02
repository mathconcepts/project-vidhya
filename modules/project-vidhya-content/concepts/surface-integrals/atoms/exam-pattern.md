---
id: surface-integrals.exam_pattern
concept_id: surface-integrals
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.6
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions ask for the numeric flux through a stated surface** — a plane patch, a piece of a sphere or cylinder, or a full closed surface — with the field and boundary given explicitly enough that the parametrization is forced rather than chosen freely.

  Example: $S:\mathbf r(u,v)=(u,v,u+v)$ over $(u,v)\in[0,1]\times[0,1]$, field $\mathbf F=(0,0,3)$. The cross product of the tangent vectors gives normal $(-1,-1,1)$, so $\mathbf F\cdot(\mathbf r_u\times\mathbf r_v)=3$, and the flux over the unit square is $3$.

- **MCQ options isolate the closed-surface shortcut.** When $S$ is closed, one option matches direct parametrization, one matches applying the divergence theorem correctly, and one applies the divergence theorem to the *wrong* enclosed volume (using the surface's bounding box instead of the region it actually encloses).

- **MSQ statements test orientation awareness** — "reversing the normal flips the sign of the flux," "the value of $\iint_S \mathbf F\cdot\mathbf n\,dS$ is independent of the parametrization chosen, given a fixed orientation," "a field tangent to the surface everywhere contributes zero flux" — three separately-true claims a student must judge without conflating orientation with parametrization choice.

- **Time budget:** a closed surface where the divergence theorem applies should take under two minutes — compute $\nabla\cdot\mathbf F$ and a volume integral, no surface parametrization needed. An open surface requiring the full tangent-cross-dot-integrate sequence needs three to four minutes, most of it spent on the cross product and any resulting $\sin\theta$ or similar area-element factor.
