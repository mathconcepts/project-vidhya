---
id: stokes-theorem.mnemonic
concept_id: stokes-theorem
atom_type: mnemonic
bloom_level: 2
difficulty: 0.7
exam_ids: ["*"]
modality: mnemonic
---

**"Any cap will do — pick the flat one."** Stokes' Theorem only cares about the boundary curve $C$; any orientable surface spanning it gives the same flux of curl, so trade a curved surface for the easiest one sharing that edge — almost always a flat disk.

**R-C-F, in order:** **R**ight-hand rule sets $\hat n$ from $C$'s direction (curl your fingers along $C$, thumb points along $\hat n$); **C**hoose the flattest surface with that same boundary; **F**lux of curl through it equals circulation around $C$ — compute whichever side is easier.

**Worked micro-example.** For $\mathbf F=(z,x,y)$: $\operatorname{curl}\mathbf F=(1,1,1)$. Capping the unit circle with the flat disk ($\hat n=\hat k$) gives flux $=\iint_D(1,1,1)\cdot\hat k\,dA=\iint_D 1\,dA=\pi$.

**Sanity-check reflex:** after swapping surfaces, confirm the replacement's boundary matches $C$ exactly in radius and orientation — a cap with the wrong edge invalidates the swap even when the arithmetic still produces a clean-looking number.
