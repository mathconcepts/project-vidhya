---
# Alternative body for ode-higher-order-intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: ode-higher-order.intuition.shaken
concept_id: ode-higher-order
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: ode-higher-order-intuition
for_stance: shaken
---

## A small case first

Take $y''-4y'+4y=0$. Guess $y=e^{rx}$: then $y'=re^{rx}$ and $y''=r^2e^{rx}$, and substituting gives $e^{rx}(r^2-4r+4)=0$. Since $e^{rx}$ is never zero, $r^2-4r+4=0$, which factors as $(r-2)^2=0$. One repeated root, $r=2$.

A single root can only supply one basis function, $e^{2x}$, but a second-order equation needs two independent ones. The second is $xe^{2x}$ — checking it directly: $(xe^{2x})''-4(xe^{2x})'+4(xe^{2x})=0$ holds, so it genuinely solves the equation.

$$y=(C_1+C_2x)e^{2x}$$

## The same idea at any order

An $n$th-order equation $a_ny^{(n)}+\cdots+a_0y=0$ turns into one polynomial, $a_nr^n+\cdots+a_0=0$, by the same substitution. A root repeated $m$ times contributes $e^{rx},xe^{rx},\ldots,x^{m-1}e^{rx}$ — one extra factor of $x$ each time the root repeats, exactly as it did above. A complex pair $\alpha\pm i\beta$ contributes $e^{\alpha x}\cos(\beta x)$ and $e^{\alpha x}\sin(\beta x)$ instead of exponentials in $r$.

Count the basis functions before writing the final answer: an $n$th-order equation needs exactly $n$ of them.
