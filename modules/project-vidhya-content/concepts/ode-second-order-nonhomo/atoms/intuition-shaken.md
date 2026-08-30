---
# Alternative body for ode-second-order-nonhomo-intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: ode-second-order-nonhomo.intuition.shaken
concept_id: ode-second-order-nonhomo
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: ode-second-order-nonhomo-intuition
for_stance: shaken
---

## One small example, split in two

Take $y''-y=e^{2x}$.

**First, ignore the forcing.** Solve $y''-y=0$: characteristic equation $r^2-1=0$ gives $r=\pm1$, so $y_h=c_1e^{x}+c_2e^{-x}$.

**Then match the forcing.** The right side is $e^{2x}$, and $r=2$ isn't a root of $r^2-1=0$, so try $y_p=Ae^{2x}$. Then $y_p''=4Ae^{2x}$, and substituting: $4Ae^{2x}-Ae^{2x}=3Ae^{2x}=e^{2x}$, giving $A=\dfrac13$.

**Add the two pieces.**

$$y=c_1e^{x}+c_2e^{-x}+\dfrac13e^{2x}$$

$y_h$ is what happens with nothing pushing the system; $y_p$ is the one extra piece the push contributes. Every non-homogeneous equation splits the same way: solve the homogeneous version first, find one particular solution matching the forcing, then add.
