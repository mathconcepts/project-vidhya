---
# Alternative body for joint-distributions.hook, served when the learner
# stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: joint-distributions.hook.assured
concept_id: joint-distributions
atom_type: hook
bloom_level: 1
difficulty: 0
exam_ids: ["*"]
variant_of: joint-distributions.hook
for_stance: assured
---

$\rho(X,Y)=0$ kills LINEAR dependence and nothing else — $Y=X^2$ for $X$ symmetric about 0 has zero correlation and total dependence, since every large positive contribution to the numerator cancels an equally large negative one. The reverse direction is airtight: independence forces $\rho=0$ always, since $\text{Cov}(X,Y)=E[XY]-E[X]E[Y]$ collapses to $0$ once the joint factors. One direction is a theorem; the other is a common wrong guess, and GATE sets exactly this trap by handing you $\rho=0$ and asking whether independence follows.
