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
id: laplace-transform-intuition.shaken
concept_id: laplace-transform
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: laplace-transform-intuition
for_stance: shaken
---

Take $y'+5y=0$, $y(0)=3$. Transform each term, using $\mathcal L\{y'\}=sY(s)-y(0)$:

$$sY(s)-3+5Y(s)=0\ \Longrightarrow\ Y(s)=\frac{3}{s+5}$$

One derivative became one factor of $s$, minus the initial condition — the differential equation is now an algebra problem in $Y(s)$. Read the table:

$$y(t)=3e^{-5t}$$

This pair comes with a region: $\dfrac{3}{s+5}$ holds for $\text{Re}(s)>-5$. Quoting $F(s)$ without that region is quoting half the answer — the same expression paired with $\text{Re}(s)<-5$ instead belongs to a different, anti-causal signal.

Keep two rules separate. $\mathcal L\{y'(t)\}=sY(s)-y(0)$ is the *transform of a derivative* — how a differential equation becomes algebra. $\mathcal L\{t\,y(t)\}=-\dfrac{d}{ds}Y(s)$ is the *derivative of a transform* — a different operation entirely, for when $t$ multiplies the function rather than differentiates it.
