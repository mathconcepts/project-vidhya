---
# Alternative body for series.hook, served when the learner stance is
# `shaken`. Concrete-first, full arithmetic, explicit check, no
# reassurance language.
id: series.hook.shaken
concept_id: series
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: series.hook
for_stance: shaken
---

Add the terms in sequence. $S_1=0.5$. $S_2=0.5+0.25=0.75$. $S_3=0.75+0.125=0.875$. $S_4=0.875+0.0625=0.9375$. Each running total climbs, but by a smaller amount than the last step. Check how far $S_4$ is from $1$: $1-0.9375=0.0625$ — exactly the size of the next term not yet added. That gap keeps halving every step and never reaches zero, so the running total never reaches $1$ either, only closes in on it. A series is just this running-total sequence; whether it settles on a number or keeps growing is the whole question.
