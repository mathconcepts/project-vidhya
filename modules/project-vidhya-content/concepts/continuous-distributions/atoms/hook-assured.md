---
# Alternative body for continuous-distributions.hook, served when the
# learner stance is `assured`. See src/content/stance-variants.ts.
id: continuous-distributions.hook.assured
concept_id: continuous-distributions
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: continuous-distributions.hook
for_stance: assured
---

You already standardize normal probabilities via $z=(x-\mu)/\sigma$ on reflex. What actually needs a check: the *memoryless* property — $P(X>s+t\mid X>s)=P(X>t)$ — belongs to the Exponential distribution specifically, and to no other continuous family on this list. Applying it to a Normal or Uniform variable (e.g. "this component has survived 5 years, so its remaining lifetime distribution is unchanged") is a real error, not a rounding one — Normal and Uniform variables *do* have a history that changes their conditional distribution.
