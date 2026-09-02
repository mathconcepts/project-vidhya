---
# Alternative body for continuous-distributions.intuition, served when the
# learner stance is `assured`. See src/content/stance-variants.ts.
id: continuous-distributions.intuition.assured
concept_id: continuous-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: continuous-distributions.intuition
for_stance: assured
---

Gamma with shape $k$ and the same rate $\lambda$ as an Exponential models the waiting time for the $k$-th event of a Poisson process, not the first — for $k=1$, Gamma collapses exactly to Exponential. Where marks are lost: applying the single-event Exponential survival formula $P(T>t)=e^{-\lambda t}$ to a "time until the 3rd event" question undercounts, because that waiting time is the *sum* of 3 exponential gaps, not one — its mean is $k/\lambda$, not $1/\lambda$. Check whether a waiting-time question is asking about the first arrival or a later one before picking the formula.
