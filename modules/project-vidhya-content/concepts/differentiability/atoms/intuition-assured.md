---
# Alternative body for differentiability.intuition, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: differentiability.intuition.assured
concept_id: differentiability
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: differentiability.intuition
for_stance: assured
---

A common false generalization: "$f$ differentiable $\Rightarrow$ $|f|$ differentiable" holds away from $f$'s zeros, and needs a real check exactly there. If $f(a)=0$ and $f'(a)\neq0$ — $f$ crosses zero transversally — $|f|$ picks up a corner at $a$: the one-sided derivatives are $+f'(a)$ and $-f'(a)$, which disagree whenever $f'(a)\neq0$. This is $|x|$ at $0$ in disguise ($f(x)=x$, $f'(0)=1$).

But if $f(a)=0$ *and* $f'(a)=0$ — $f$ touches zero rather than crossing it — $|f|$ stays differentiable at $a$, with derivative $0$ from both sides. $f(x)=x^3$ has $f'(0)=0$; $|f(x)|=|x|^3$, and $\frac{|h|^3}{h}=|h|\cdot h\to0$ from either direction, no corner, despite $f$ changing sign there.

The condition that decides it is whether $f'$ vanishes at the zero, not whether $f$ changes sign there.
