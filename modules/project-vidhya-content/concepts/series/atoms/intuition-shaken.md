---
# Alternative body for series.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: series.intuition.shaken
concept_id: series
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: series.intuition
for_stance: shaken
---

$\sum_{n=1}^\infty\frac1{2^n}=\frac12+\frac14+\frac18+\cdots$. Add the partial sums one at a time: $S_1=\frac12$, $S_2=\frac34$, $S_3=\frac78$, $S_4=\frac{15}{16}$. Each one is exactly $1$ minus a shrinking gap — $S_N=1-\frac1{2^N}$ — and as $N\to\infty$, that gap vanishes, so $S_N\to1$. The series **converges** to $1$, because the sequence of partial sums does.

The harmonic series $\sum\frac1n=1+\frac12+\frac13+\cdots$ looks similar at first glance, but its partial sums never level off: $S_1=1$, $S_2=1.5$, $S_4\approx2.08$, $S_8\approx2.72$ — climbing forever, just slowly.

$e^x\approx1+x+\frac{x^2}{2!}+\frac{x^3}{3!}$ is exactly this idea put to work: an engineer sums finitely many terms of a series known to converge, betting the leftover tail is small enough to ignore.

The test that matters first for speed: recognize $\sum r^n$ converges only for $|r|<1$, and $\sum\frac1n$ diverges — before reaching for a heavier test like ratio or root.
