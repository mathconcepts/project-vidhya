---
# Alternative body for mean-value-theorems.intuition, served when the
# learner stance is `assured`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: mean-value-theorems.intuition.assured
concept_id: mean-value-theorems
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: mean-value-theorems.intuition
for_stance: assured
---

MVT is a pure existence theorem: it guarantees some $c$ exists, never which one, and never that it is unique. Solving $f'(c)=\text{average slope}$ can return several valid $c$'s in $(a,b)$; all of them satisfy the theorem, and picking the one a problem actually wants is a separate check MVT itself does not make for you.

MVT genuinely fails for vector-valued functions — a trap only visible once someone reaches beyond single real-valued $f$. Take $f(t)=(\cos t,\sin t)$ on $[0,2\pi]$: $f(2\pi)-f(0)=(0,0)$, but $f'(t)=(-\sin t,\cos t)$ never equals $(0,0)$ for any $t$, since $\|f'(t)\|=1$ always. No single $c$ makes the exact equality hold; only a weaker inequality form ($\|f(b)-f(a)\|\le M(b-a)$ for a bound $M$ on $\|f'\|$) survives into higher dimensions.

Rolle's theorem is the $f(a)=f(b)$ special case, forcing average slope to $0$ — recognizing it early collapses the algebra to solving $f'(c)=0$ directly, skipping the general slope formula entirely.
