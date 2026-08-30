---
# Alternative body for continuous-distributions-worked-example, served when
# the learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Note: the base atom's own id is `continuous-distributions-worked-example`
# (no dot before the atom type), a legacy naming drift
# check-content-integrity.ts tolerates. variant_of points at that exact id;
# this file's own id follows the normal convention instead of propagating
# the drift.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
#
# The fenced interactive block below is copied verbatim from the base
# atom so the widget cannot drift between variants; only prose differs.
id: continuous-distributions.worked_example.assured
concept_id: continuous-distributions
atom_type: worked_example
bloom_level: 3
difficulty: 0.40
exam_ids: [gate-ma]
scaffold_fade: 1
variant_of: continuous-distributions-worked-example
for_stance: assured
---

## Normal and exponential, computed directly

$Z_{46}=-1$, $Z_{58}=2$, so $P(46<X<58)=\Phi(2)-\Phi(-1)=0.9772-0.1587=0.8185$. For the exponential: $\lambda=1/500$, $P(T\le300)=1-e^{-0.6}=1-0.5488=0.4512$.

## The habit worth having at exam speed

Use $\Phi(-z)=1-\Phi(z)$ rather than looking up negative $z$ — halves the table you need memorized. For the exponential side, skip re-deriving the CDF each time: $P(T>t)=e^{-\lambda t}$ is the survival function, and $P(T\le t)$ is just one minus it.

## Where this generalizes past both problems

Both computations are the same move: convert a raw variable to a standardized one whose CDF is tabulated ($Z$ for Normal, closed-form for Exponential), then read off or subtract. Recognizing which family applies is the actual skill; the arithmetic after that is mechanical.

```interactive-spec
{"v":1,"kind":"guided_walkthrough","title":"Walk through: normal and exponential distribution probabilities","steps":[{"prompt":"X ~ N(100, 25) (so σ = 5). Find P(X > 110).","hint":"Standardize: Z = (110 − 100) / 5 = 2. Then P(X > 110) = P(Z > 2) = 1 − Φ(2). Use Φ(2) ≈ 0.9772.","answer":"Z = (110 − 100) / 5 = 2. P(X > 110) = 1 − Φ(2) = 1 − 0.9772 = 0.0228. About 2.28% of values exceed 110."},{"prompt":"A component has exponential lifetime with mean 200 hours. What is the probability it survives beyond 400 hours?","hint":"λ = 1/200. P(T > t) = e^{−λt}. Substitute t = 400. Note that 400 = 2 × mean.","answer":"λ = 1/200. P(T > 400) = e^{−(1/200)·400} = e^{−2} ≈ 0.1353. Only about 13.5% of components last twice their mean lifetime — the exponential distribution decays quickly."}]}
```
