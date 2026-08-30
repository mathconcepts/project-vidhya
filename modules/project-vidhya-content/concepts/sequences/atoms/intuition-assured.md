---
# Alternative body for sequences.intuition, served when the learner stance
# is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: sequences.intuition.assured
concept_id: sequences
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: sequences.intuition
for_stance: assured
---

Monotone alone is not enough, matching bounded alone: $a_n=n$ is monotone increasing but unbounded, hence divergent (to $+\infty$) — the Monotone Convergence Theorem needs *both* properties together, not either as a substitute for the other.

A genuinely useful proof tool: if a sequence has two subsequences converging to different limits, the sequence itself diverges. $a_n=(-1)^n$ has the even-indexed subsequence converging to $1$ and the odd-indexed subsequence converging to $-1$ — two different destinations rule out any single limit for the whole sequence, without needing to invoke oscillation informally.

The direction of the Monotone Convergence Theorem matters too: it proves existence of a limit without ever computing what that limit is — a bounded monotone sequence defined by a nasty recursion can be proven convergent this way even when solving for the actual limiting value requires separate work.
