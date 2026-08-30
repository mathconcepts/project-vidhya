---
# Alternative body for sequences.intuition, served when the learner stance
# is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: sequences.intuition.shaken
concept_id: sequences
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: sequences.intuition
for_stance: shaken
---

$a_n=\frac1n$ gives $1,\,0.5,\,0.33,\,0.25,\dots$ — each term closer to $0$ than the last. Formally: pick any tiny distance, say $0.001$; past $n=1000$, every term $\frac1n$ is within $0.001$ of $0$. That is convergence: past some point, every later term stays within any distance you name of the limit.

Not every sequence settles. $a_n=n$ gives $1,2,3,4,\dots$ — it grows without bound, never approaching a fixed number: divergent. So does $a_n=(-1)^n$: $-1,1,-1,1,\dots$ — it never grows, but it never stops bouncing between two values either, so it still diverges.

$a_n=\sin(n)$ never leaves the interval $[-1,1]$ — it is bounded, since every term sits inside a fixed range. But bounded is not the same as convergent: $\sin(n)$ stays trapped between $-1$ and $1$ forever without ever settling on one number, so it is bounded *and* divergent at the same time.

Two checks worth keeping separate: does the sequence stay inside some fixed range (bounded), and does it home in on one specific number (convergent)? A sequence can pass the first and fail the second.
