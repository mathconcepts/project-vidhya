---
# Alternative body for sampling-distributions.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: sampling-distributions.intuition.shaken
concept_id: sampling-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.45
exam_ids: ["*"]
scaffold_fade: true
variant_of: sampling-distributions.intuition
for_stance: shaken
---

## Same experiment, a different number every time

Draw 30 students, average their heights: some number, say $165.2$. Draw a different 30: maybe $164.8$. Repeat forever, and those averages themselves form their own distribution — the sampling distribution of $\bar{X}$.

## The Central Limit Theorem, concretely

Whatever the population looks like, as $n$ grows, $\bar{X}$'s distribution becomes approximately normal, centered at the true mean $\mu$, with spread $\sigma/\sqrt{n}$ — smaller than the population's own spread, since averaging cancels out extremes. Rule of thumb: $n\ge30$ is usually enough.

## Two distributions for when the picture gets less certain

You almost never know the true $\sigma$; estimate it with sample $s$ instead, and $T=\dfrac{\bar{X}-\mu}{s/\sqrt{n}}$ now follows Student's $t$ with $n-1$ degrees of freedom — fatter tails than $Z$, to cover not knowing $\sigma$ exactly. Separately, if $Z_1,\dots,Z_k$ are independent standard normals, $\sum Z_i^2\sim\chi^2_k$; the sample-variance statistic $(n-1)s^2/\sigma^2$ follows exactly this, $\chi^2_{n-1}$ — reach for it when the question is about spread, not center.

## The one choice that decides everything

Normal when $\sigma$ is known (or $n$ is large); $t$ when $\sigma$ is unknown; $\chi^2$ when testing variance itself. Picking the wrong one is the most common way marks go missing here.
