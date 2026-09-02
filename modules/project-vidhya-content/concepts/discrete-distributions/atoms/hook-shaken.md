---
# Alternative body for discrete-distributions.hook, served when the
# learner stance is `shaken`. See src/content/stance-variants.ts.
id: discrete-distributions.hook.shaken
concept_id: discrete-distributions
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: discrete-distributions.hook
for_stance: shaken
---

A call center gets 2 calls per minute, on average.

What's the chance of exactly 0 calls next minute? There's no fixed set of trials here to count — calls just arrive.

That's the Poisson distribution's job: $P(X=k) = \dfrac{e^{-\lambda}\lambda^k}{k!}$, with $\lambda=2$ as the average rate.

For $k=0$: $P(X=0)=e^{-2}\approx0.135$.

Four distributions, four different stories — matching the story to the shape is the actual skill here.
