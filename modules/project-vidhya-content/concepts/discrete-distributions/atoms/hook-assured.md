---
# Alternative body for discrete-distributions.hook, served when the
# learner stance is `assured`. See src/content/stance-variants.ts.
id: discrete-distributions.hook.assured
concept_id: discrete-distributions
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: discrete-distributions.hook
for_stance: assured
---

You already recognize the four shapes by name. The distinction that actually costs marks: Binomial assumes each trial's success probability stays fixed (sampling *with* replacement, or an effectively infinite population); Hypergeometric applies the moment you're drawing from a *finite* population *without* replacement, where each draw changes the odds for the next. A batch of 20 items with 3 defective, sampled 5 without replacement, is Hypergeometric — using Binomial there treats the defect rate as constant across draws, which it isn't.
