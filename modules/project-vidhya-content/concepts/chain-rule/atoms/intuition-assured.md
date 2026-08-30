---
# Alternative body for chain-rule.intuition, served when the learner stance is
# `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: chain-rule.intuition.assured
concept_id: chain-rule
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: chain-rule-intuition
for_stance: assured
---

The chain rule's teeth show up exactly where a composition secretly is not smooth: $f(g(x))=|\sin x|$ fails to differentiate at $x=n\pi$, not because $\sin$ misbehaves there but because $f(u)=|u|$ has a corner at $u=0$ and $\sin$ crosses zero *transversally* ($\sin'(n\pi)=\pm1\neq0$) at exactly those points. The rule needs $f$ differentiable *at $g(x)$*, not merely differentiable somewhere — and $g(x)=0$ is precisely where $f=|\cdot|$ fails.

The other self-inflicted failure: reaching for the chain rule on $f(x)g(x)$, where no inner/outer structure exists at all. There is nothing to unwind — multiplying derivatives here is the single most common GATE distractor on this topic, and the fix is recognizing a product, not a composition.

Nested composition scales additively, not in difficulty: $n$ layers give $n$ factors multiplied together, but each factor must be evaluated at the value *that layer* receives, not at $x$ itself — for $f(g(h(x)))$ the middle factor is $g'(h(x))$, evaluated at $h(x)$, never at $x$. Evaluating every factor at the same point is the error that survives correct differentiation and still returns the wrong number.
