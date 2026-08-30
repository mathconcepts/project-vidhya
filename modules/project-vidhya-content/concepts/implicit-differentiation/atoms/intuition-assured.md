---
# Alternative body for implicit-differentiation.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: implicit-differentiation.intuition.assured
concept_id: implicit-differentiation
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: implicit-differentiation-intuition
for_stance: assured
---

$\frac{dy}{dx}=-\frac{x}{y}$ is undefined at $y=0$ — not a computational slip, but a genuine vertical tangent, since the curve's slope really is infinite there (e.g. $(\pm5,0)$ on $x^2+y^2=25$). Reporting "derivative doesn't exist" at such a point is the correct answer, not a sign the calculation went wrong.

A sharper trap: if *both* $\frac{\partial F}{\partial x}$ and $\frac{\partial F}{\partial y}$ vanish simultaneously on $F(x,y)=0$, the implicit function theorem gives no formula at all — the curve can have a genuine singularity there (a self-crossing or a cusp), as at the origin on the Folium of Descartes $x^3+y^3=6xy$. The quotient $-F_x/F_y$ becomes $\frac00$, and no algebraic manipulation recovers a single tangent slope, because there may not be one.

Second derivatives compound the trap: differentiating $\frac{dy}{dx}$ implicitly again leaves $\frac{dy}{dx}$ itself inside the result — it must be re-substituted with the already-found first-derivative expression before the answer counts as simplified.
