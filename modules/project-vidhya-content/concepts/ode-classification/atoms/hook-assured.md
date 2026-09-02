---
# Alternative body for ode-classification.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the one distinction that costs marks
# rather than re-teaching what they can already do.
id: ode-classification.hook.assured
concept_id: ode-classification
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: ode-classification.hook
for_stance: assured
---

Order and degree are graded independently, and conflating them under time pressure costs marks. Order counts derivatives; degree counts the power on the *highest-order* one, and only once the equation is polynomial in its derivatives — a derivative under a root, in a denominator with another derivative, or inside $\sin$, $\cos$, $\log$ or $e^{(\cdot)}$ leaves degree **undefined**, never defaulted to $1$. Linearity is a third, separate question entirely: it fails the moment $y$ or any derivative multiplies another derivative, or sits inside a nonlinear function of itself — regardless of what degree the equation carries. A high-degree equation can still be routine to classify; a degree-$1$ equation can still be non-linear.
