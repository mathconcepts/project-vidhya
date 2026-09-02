---
# Alternative body for divergence-curl.intuition, served when the learner
# stance is `assured`.
id: divergence-curl.intuition.assured
concept_id: divergence-curl
atom_type: intuition
bloom_level: 2
difficulty: 0.12
exam_ids: ["*"]
modality: visual
variant_of: divergence-curl.intuition
for_stance: assured
---

The distinction that costs marks here is **sign**, not concept. 2D curl $\partial Q/\partial x-\partial P/\partial y$ is positive for **counterclockwise** spin by convention — the right-hand rule with the plane's normal taken as $+z$. Write the same swirl the other way, $\mathbf H=(y,-x)$ instead of $\mathbf G=(-y,x)$, and the identical physical rotation now scores $\operatorname{curl}\mathbf H=-2$, not $+2$.

The spin itself did not change; only which direction was called "positive" did. That is a bookkeeping choice fixed *before* the computation, not something the algebra tells you — dropping it, or silently flipping it partway through a problem, is a far more common source of a wrong sign than any confusion about what divergence or curl mean.

Divergence carries no such ambiguity: $\operatorname{div}\mathbf F$ has one sign convention only, source positive, sink negative, because "outward" needs no orientation choice to define.
