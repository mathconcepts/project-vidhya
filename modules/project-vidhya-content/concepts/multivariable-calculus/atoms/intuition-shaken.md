---
# Alternative body for multivariable-calculus.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: multivariable-calculus.intuition.shaken
concept_id: multivariable-calculus
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: multivariable-calculus.intuition
for_stance: shaken
---

Stand on the hillside $z=x^2+3xy$ at $(x,y)=(2,1)$, where $z=4+6=10$. Walk east: freeze $y=1$, differentiate with respect to $x$ only: $\frac{\partial z}{\partial x}=2x+3y$, which at $(2,1)$ gives $4+3=7$. Walk north instead: freeze $x=2$, differentiate with respect to $y$ only: $\frac{\partial z}{\partial y}=3x$, which at $(2,1)$ gives $6$. Two different slopes, from the same spot, depending only on which way you walked.

Each partial derivative treats every other variable as a plain number while it works — that is the entire technique: freeze everything except the one variable named in the $\partial$, differentiate as usual, done.

Collect both partials into one row, $[\frac{\partial z}{\partial x},\frac{\partial z}{\partial y}]=[7,6]$ at this point, and that row is the Jacobian of a scalar function — a complete snapshot of the steepness in every direction at once, built from just these two numbers.

To compute a partial derivative on an exam: pick the variable named in the $\partial$, treat every other letter as a constant, and differentiate exactly the way single-variable calculus already taught.
