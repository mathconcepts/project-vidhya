---
# Alternative body for numerical-error-analysis.intuition, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-error-analysis.intuition.shaken
concept_id: numerical-error-analysis
atom_type: intuition
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
scaffold_fade: true
variant_of: numerical-error-analysis.intuition
for_stance: shaken
---

## One measurement, two different verdicts

A rod measures $L_a=9.97$ cm against a true length $L_t=10.00$ cm. Absolute error: $E_a=|10.00-9.97|=0.03$. By itself, $0.03$ says nothing about whether that matters.

Put the same $0.03$ gap on a bolt whose true length is $L_t=0.06$ cm instead: relative error $E_r=0.03/0.06=0.5$, or $50\%$ — nothing like the rod's $E_r=0.03/10.00=0.003$, or $0.3\%$. The absolute gap was identical both times; the relative one, which normalises against the size of the thing measured, is what actually tells you which error matters.

Errors also arrive from two different places. Rounding $3.14159$ to $3.1416$ loses information because only finitely many digits were kept — that is representation going wrong. Stopping a Taylor series after three terms, or a root-finder after five iterations, loses information because the process itself was cut short — that is approximation going wrong. More decimal places fix the first kind and do nothing for the second.

Combine two approximate numbers and their errors combine too, by a rule that depends on the operation. Add $p=12.5\pm0.05$ to $q=8.2\pm0.02$ and the absolute errors add: at worst $0.05+0.02=0.07$. Multiply the same two numbers and it is the relative errors that add instead — about $0.0064$, converting back to roughly $0.66$ on the product $102.5$.
