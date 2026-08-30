---
# Alternative body for discrete-distributions.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: discrete-distributions.intuition.shaken
concept_id: discrete-distributions
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: discrete-distributions.intuition
for_stance: shaken
---

## Four stories, one small example each

Binomial — fixed tries: flip a coin 3 times, $P(\text{exactly }2\text{ heads})=\binom{3}{2}(0.5)^2(0.5)=0.375$. Poisson — no fixed number of tries, just a rate: emails in an hour, average 5, gives $P(X=k)=\dfrac{e^{-5}5^k}{k!}$, and $k$ could turn out to be $0$ or $50$. Geometric — count tries UNTIL the first success: rolling a die until a 6 lands, $P(\text{first }6\text{ on try }2)=(5/6)(1/6)\approx0.139$. Hypergeometric — draw without putting back: 5 defective among 50 items, inspect 10; each draw changes what's left, unlike the other three stories.

## The question that sorts all four

Is the number of tries fixed and known in advance? Are you counting successes, or waiting for the very first one? Does one draw change the odds for the next? Those three answers pick the distribution before any formula gets touched.
