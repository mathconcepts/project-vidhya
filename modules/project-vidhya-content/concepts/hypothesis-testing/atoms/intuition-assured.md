---
# Alternative body for hypothesis-testing.intuition, served when the
# learner stance is `assured`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who already has the mechanics: terse, assumes the
# vocabulary, and spends its words on the distinctions that actually cost
# marks (degenerate cases, faster routes, common false generalisations)
# rather than re-teaching what they can already do.
id: hypothesis-testing.intuition.assured
concept_id: hypothesis-testing
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: hypothesis-testing.intuition
for_stance: assured
---

## The test statistic, chosen by what you know

$\sigma$ known → $z$; $\sigma$ unknown → $t_{n-1}$; testing variance or fit → $\chi^2$. Picking $z$ when $\sigma$ was only estimated understates uncertainty and inflates false rejections — the most common setup error here.

## $\alpha$, $\beta$, and the trade-off rarely stated explicitly

Lowering $\alpha$ (fewer false alarms) raises $\beta$ (more missed real effects) for fixed $n$ — shrinking both at once needs a larger sample. Choose $\alpha$ before seeing data; choosing it after, to make a result "significant," invalidates the whole framework.

## The sentence that never gets to be true

"We accept $H_0$" is not a valid conclusion — only "fail to reject" is. A p-value of $0.6$ says the data are consistent with $H_0$; it never rules out how many rival hypotheses the same data would also fit; reading it as the probability $H_0$ is true is a category error.
