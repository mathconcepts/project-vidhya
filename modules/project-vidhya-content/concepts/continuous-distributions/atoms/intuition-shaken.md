---
# Alternative body for continuous-distributions.intuition, served when the
# learner stance is `shaken`. See src/content/stance-variants.ts.
id: continuous-distributions.intuition.shaken
concept_id: continuous-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.15
exam_ids: ["*"]
variant_of: continuous-distributions.intuition
for_stance: shaken
---

A curve, not a bar chart. Height at one point isn't a probability — area between two points is.

$$P(a<X<b) = \int_a^b f(x)\,dx, \qquad \int_{-\infty}^{\infty} f(x)\,dx = 1$$

Normal: symmetric bell, centered at $\mu$. Standardize with $z=(x-\mu)/\sigma$ to use one shared table.

Exponential: models waiting time. No memory of the past — a component that's already lasted 5 years has the same remaining-lifetime odds as a new one.

Uniform: flat, equal density everywhere on an interval.

Gamma: waiting for the $k$-th event, not just the first.
