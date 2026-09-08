---
# Alternative body for laplace-transform.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: laplace-transform.intuition.shaken
concept_id: laplace-transform
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: laplace-transform-intuition
for_stance: shaken
---

Take $y'+2y=0$, $y(0)=1$ — the same equation whose solution, $e^{-2t}$, you already watched decay in the hook. Transform each term, using $\mathcal L\{y'\}=sY(s)-y(0)$:

$$sY(s)-1+2Y(s)=0\ \Longrightarrow\ Y(s)=\frac{1}{s+2}$$

One derivative became one factor of $s$, minus the initial condition — the differential equation is now an algebra problem in $Y(s)$. Read the table:

$$y(t)=e^{-2t}$$

Same pole, same curve, same pair the hook already showed you — this time reached by transforming a differential equation instead of a bare function.

This pair comes with a region too: $\dfrac{1}{s+2}$ holds only for $\text{Re}(s)>-2$. Quoting $F(s)$ without that region is quoting half the answer — the same expression paired with $\text{Re}(s)<-2$ instead belongs to a different, anti-causal signal.

Keep two rules separate. $\mathcal L\{y'(t)\}=sY(s)-y(0)$ is the *transform of a derivative* — how a differential equation becomes algebra. $\mathcal L\{t\,y(t)\}=-\dfrac{d}{ds}Y(s)$ is the *derivative of a transform* — a different operation entirely, for when $t$ multiplies the function rather than differentiates it.
