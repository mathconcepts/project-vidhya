---
# Alternative body for ode-second-order-homo.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: ode-second-order-homo.intuition.shaken
concept_id: ode-second-order-homo
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: ode-second-order-homo.intuition
for_stance: shaken
---

## One small example

Look at $y''-5y'+6y=0$ and try $y=e^{rx}$ as the solution. Its derivatives are $y'=re^{rx}$, $y''=r^2e^{rx}$; put those into the equation:

$$e^{rx}(r^2-5r+6)=0$$

$e^{rx}$ is never zero, so $r^2-5r+6=0$ — the characteristic equation. Factor it: $(r-2)(r-3)=0$, giving $r=2$ and $r=3$.

Two distinct roots on a second-order equation hand back exactly two basis functions:

$$y=c_1e^{2x}+c_2e^{3x}$$

One substitution turned a calculus problem, solving a differential equation, into an algebra problem, factoring a quadratic. Every $ay''+by'+cy=0$ works the same way: write $ar^2+br+c=0$, solve for $r$, and the roots hand you the solution directly.
