---
# Alternative body for pde-basics-intuition, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: pde-basics.intuition.shaken
concept_id: pde-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: pde-basics-intuition
for_stance: shaken
---

## Classify one equation

Take $u_t=u_{xx}$. Matched against $Au_{xx}+Bu_{xy}+Cu_{yy}=0$ with $t$ standing in for $y$: there is no $u_{yy}$ term at all, so $A=1$, $B=0$, $C=0$, and

$$\Delta=B^2-4AC=0-0=0$$

$\Delta=0$ is the parabolic case — the heat equation always lands here.

## Split it into two smaller equations

Guess $u(x,t)=X(x)T(t)$. Substituting into $u_t=u_{xx}$ and dividing by $XT$:

$$\frac{T'}{T}=\frac{X''}{X}$$

The left side depends only on $t$; the right only on $x$. Two sides that depend on different variables can only stay equal for every $x$ and $t$ if both sit at the same constant — call it $-\lambda$. That single fact is the whole justification for the method; nothing subtler is going on.

Boundary conditions on $u$ then decide which values of $\lambda$ are actually allowed, and the full solution adds up the pieces for every allowed one.
