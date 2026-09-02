---
id: stokes-theorem.exam_pattern
concept_id: stokes-theorem
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.7
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT "verify Stokes' theorem" or "evaluate the flux" questions almost always reward swapping to a flat cap first.** Compute $\operatorname{curl}\mathbf F$, dot it with the flat cap's constant normal, and only then integrate — skip parametrizing the original curved surface entirely.

  Example: for $\mathbf F=(0,0,x^2)$ over the unit hemisphere capped by the unit disk, $\operatorname{curl}\mathbf F=(0,-2x,0)$. Dotted with the disk's normal $\hat n=\hat k$, this is $0$ before any integral is set up — the flux is $0$ with no area computation at all.

- **MCQ orientation questions test the right-hand rule directly**, not computation: given a boundary direction, which normal does Stokes' Theorem require? Reversing either $C$ or $\hat n$ alone flips the sign of the answer.

- **MSQ "which surfaces are valid" stems test surface independence**: any two orientable surfaces sharing the same boundary $C$ give the same flux — a true statement worth recognizing on sight, not re-deriving from scratch each time.

- **Time budget:** dot curl with the cap's normal *before* setting up any integral — if that dot product is already zero, the answer is zero in under 15 seconds; otherwise, budget under 90 seconds for the area piece that remains.
