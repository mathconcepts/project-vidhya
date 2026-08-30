---
# Alternative body for laplace-applications.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: laplace-applications.intuition.shaken
concept_id: laplace-applications
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: laplace-applications.intuition
for_stance: shaken
---

Take $y'+2y=6$, $y(0)=0$ — constant coefficients, a constant forcing term: exactly the signal that Laplace is the right tool.

Transform once: $sY(s)+2Y(s)=\dfrac{6}{s}$, so

$$Y(s)=\frac{6}{s(s+2)}$$

Before inverting anything, check the steady state with the final-value theorem:

$$\lim_{t\to\infty}y(t)=\lim_{s\to0}sY(s)=\lim_{s\to0}\frac{6}{s+2}=3$$

That $3$ is a check you can run on the un-inverted $Y(s)$ — if the $y(t)$ you eventually compute by partial fractions doesn't settle at $3$, the algebra went wrong before you ever inverted anything.

Hold onto this: $y'$ became $sY(s)-y(0)$, turning the differential equation into algebra, and the final-value theorem checks the answer's destination before you find its full shape.
