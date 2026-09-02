---
# Alternative body for hypothesis-testing.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: hypothesis-testing.intuition.shaken
concept_id: hypothesis-testing
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: hypothesis-testing.intuition
for_stance: shaken
---

## The setup, with real numbers first

Claim: bulbs last $\mu_0=1000$ hours. A sample of $n=36$ gives $\bar{x}=980$, with known $\sigma=180$. Two competing statements: $H_0:\mu=1000$ (the claim, assumed true until data forces a rejection) and $H_1:\mu\neq1000$ (the challenger).

## Two ways to be wrong

Reject $H_0$ when it's actually true → Type I error, rate $\alpha$ (usually $0.05$, fixed in advance). Fail to reject $H_0$ when it's actually false → Type II error, rate $\beta$.

|  | $H_0$ true | $H_0$ false |
|---|---|---|
| Reject | Type I ($\alpha$) | correct |
| Don't reject | correct | Type II ($\beta$) |

## Which formula

$\sigma$ known → $z=\frac{\bar{x}-\mu_0}{\sigma/\sqrt{n}}$. $\sigma$ unknown, use sample $s$ instead → $t$ with $n-1$ degrees of freedom. Testing a proportion or a fit → $\chi^2$.

## The p-value, concretely

It's the probability of a result at least this extreme, ASSUMING $H_0$ is true — not the probability $H_0$ is true. Smaller than $\alpha$ means reject $H_0$.

## What this can never say

Failing to reject $H_0$ never proves $\mu=1000$ exactly. It only says this sample isn't strong enough evidence against the claim.
