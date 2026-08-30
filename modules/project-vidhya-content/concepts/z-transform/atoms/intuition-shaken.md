---
# Alternative body for z-transform.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: z-transform.intuition.shaken
concept_id: z-transform
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: z-transform.intuition
for_stance: shaken
---

Picture a sequence that is just $3$ at sample $n=0$ and $0$ everywhere else. Its Z-transform is just that coefficient, sitting at its own power of $z^{-n}$:

$$X(z)=3z^{0}=3$$

Delay the same signal by one sample — the $3$ now sits at $n=1$ instead of $n=0$ — and the transform picks up exactly one factor of $z^{-1}$:

$$3z^{-1}$$

That is the whole mechanism: shifting a sequence one step later multiplies its transform by $z^{-1}$. Nothing more is happening than that.

Now use it on a real recurrence: $y[n]-0.5y[n-1]=\delta[n]$, with $y[n]=0$ for $n<0$. Transform both sides — $y[n-1]$ becomes $z^{-1}Y(z)$ by the same rule, and $\delta[n]$ transforms to $1$:

$$Y(z)-0.5z^{-1}Y(z)=1\ \Longrightarrow\ Y(z)=\frac{1}{1-0.5z^{-1}}=\frac{z}{z-0.5}$$

Match this to the pair $\dfrac{z}{z-a}\leftrightarrow a^nu[n]$ with $a=0.5$:

$$y[n]=(0.5)^n u[n]$$

Hold onto one thing: $z^{-1}$ is not a new kind of number, it is a one-sample delay, and a difference equation becomes algebra the moment every delayed term is rewritten that way.
