---
# Alternative body for pde-basics-intuition, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: pde-basics.intuition.assured
concept_id: pde-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: pde-basics-intuition
for_stance: assured
---

The separation constant's sign isn't a formality: writing $X''/X=-\lambda$ produces oscillatory spatial solutions $\sin,\cos$ under zero Dirichlet data; the same relation with $+\lambda$ gives exponentials that can't vanish at both endpoints except trivially. Pick the sign the boundary conditions demand, not the one that looks conventional.

Well-posedness tracks the PDE type: elliptic equations pair naturally with data on a closed boundary curve (Dirichlet or Neumann), hyperbolic ones with initial data on an open, non-characteristic curve. Supplying the wrong kind of data for the type is a distinct failure from any error in the separation algebra itself, and GATE occasionally tests the recognition alone.
