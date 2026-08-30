---
# Alternative body for limits.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: limits.intuition.shaken
concept_id: limits
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: limits-intuition
for_stance: shaken
---

$\lim_{x\to2}f(x)$ asks what $f$ is heading toward as $x$ closes in on $2$ — not what $f(2)$ equals, and not even whether $f(2)$ exists at all.

Take $f(x)=x+1$ for $x<2$ and $f(x)=x+3$ for $x\ge2$. From the left, at $x=1.9$: $f=2.9$; at $x=1.99$: $f=2.99$ — heading toward $3$. From the right, at $x=2.1$: $f=5.1$; at $x=2.01$: $f=5.01$ — heading toward $5$. Left gives $3$, right gives $5$: they disagree, so the two-sided limit does not exist.

When both sides do agree, algebra combines cleanly: if $\lim_{x\to a}f=L$ and $\lim_{x\to a}g=M$, then $\lim_{x\to a}(f+g)=L+M$ and $\lim_{x\to a}(fg)=LM$, no extra work needed.

The squeeze theorem pins a limit down by trapping it: since $-|x|\le x\sin(1/x)\le|x|$ for every $x$, and both bounds head to $0$ as $x\to0$, the trapped function must head to $0$ too — check it at $x=0.01$: $x\sin(1/x)$ sits between $-0.01$ and $0.01$, already tiny.

When plugging in gives $\frac00$, L'Hôpital's rule differentiates numerator and denominator separately: $\lim_{x\to0}\frac{\sin x}{x}\stackrel{\text{L'H}}{=}\lim_{x\to0}\frac{\cos x}{1}=\cos0=1$, matching the memorized value directly.
