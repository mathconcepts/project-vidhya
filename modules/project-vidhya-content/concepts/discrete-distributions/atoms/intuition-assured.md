---
# Alternative body for discrete-distributions.intuition, served when the
# learner stance is `assured`. See src/content/stance-variants.ts.
id: discrete-distributions.intuition.assured
concept_id: discrete-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: discrete-distributions.intuition
for_stance: assured
---

Poisson isn't a separate family invented from scratch — it's the limit of Binomial as $n\to\infty$, $p\to0$, holding $np=\lambda$ fixed: rephrase "rate $\lambda$ per unit time" as "infinitely many infinitesimal sub-intervals, each with a tiny, near-constant success chance." That's why Poisson is the right approximation for Binomial when $n$ is large and $p$ is small (a common rule of thumb: $n\ge20$, $p\le0.05$) — using the exact Binomial formula there isn't wrong, just needlessly heavy, and using Poisson when $p$ isn't actually small (say $p=0.3$) silently drops the accuracy the limit requires.
