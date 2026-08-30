---
# Alternative body for ode-exact-intuition, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: ode-exact.intuition.assured
concept_id: ode-exact
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: ode-exact-intuition
for_stance: assured
---

The two-step build of $F$ (integrate $M$ in $x$, then differentiate in $y$ to fix $g(y)$) is asymmetric on purpose: $g(y)$ absorbs exactly what the $x$-integration was blind to. Integrating $M$ in $x$ and $N$ in $y$ separately and then "combining" the two results double-counts any term both share — the failure mode here, not the calculus.

When $\partial M/\partial y \neq \partial N/\partial x$, don't reach for a general integrating factor: it exists in closed form only when $(M_y-N_x)/N$ depends on $x$ alone, giving $\mu(x)=e^{\int (M_y-N_x)/N\,dx}$, or symmetrically when $(N_x-M_y)/M$ depends on $y$ alone. Neither holding means the equation isn't exact-by-integrating-factor at all, not that more searching is needed.
