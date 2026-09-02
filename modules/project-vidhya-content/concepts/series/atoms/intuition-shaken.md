---
# Alternative body for series.intuition, served when the learner stance is
# `shaken`. Concrete-first, smallest true step, explicit check.
id: series.intuition.shaken
concept_id: series
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: series.intuition
for_stance: shaken
---

A series $\sum a_n$ is a list of running totals. Write them down for $\sum \frac1{2^n}$: $S_1=0.5$, $S_2=0.75$, $S_3=0.875$, $S_4=0.9375$. Each step adds less than the step before. "The series converges" just means: this list of running totals converges — nothing more.

Now $\sum \frac1n$: $S_1=1$, $S_2=1.5$, $S_3\approx1.833$, $S_4\approx2.083$. The terms $\frac1n$ shrink too, but the running total keeps climbing without settling. Check: both series have terms going to $0$. Only one running total stops climbing. That's the difference a convergence test is built to catch — not whether terms shrink, but how fast.
