---
# Alternative body for numerical-linear-algebra.hook, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: numerical-linear-algebra.hook.assured
concept_id: numerical-linear-algebra
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: numerical-linear-algebra.hook
for_stance: assured
---

Jacobi and Gauss-Seidel converge only when $A$ is strictly diagonally dominant — a property of how the equations are written, not of whether the system has a solution. Reorder $4x+y=6,\ x+3y=5$ as $x+3y=5,\ 4x+y=6$ and dominance is gone: the identical, perfectly solvable system, run through the same Jacobi update from $0,0$, produces $5,6$ then $-13,-14$, while direct elimination on those same equations still gives $x=13/11$ in one pass.
