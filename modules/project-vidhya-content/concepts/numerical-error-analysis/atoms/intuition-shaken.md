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
difficulty: 0.1
exam_ids: ["*"]
variant_of: numerical-error-analysis.intuition
for_stance: shaken
---

## One measurement, two different verdicts

A resistor reads $100.0\,\Omega$ on the meter; its true value is $99.7\,\Omega$. Absolute error: $E_a=|100.0-99.7|=0.3$. By itself, $0.3$ says nothing about whether that matters.

Put the same $0.3\,\Omega$ gap on a $1\,\Omega$ resistor instead: relative error $E_r=0.3/1=0.3$, or $30\%$ — nothing like the $100\,\Omega$ resistor's $E_r=0.3/100=0.003$, or $0.3\%$. The absolute gap was identical both times; the relative one is what tells you which error matters.

Errors also arrive from two different places. Rounding $3.14159$ to $3.1416$ loses information because only finitely many digits were kept. Stopping a Taylor series after three terms, or a root-finder after five iterations, loses information because the process itself was cut short. More decimal places fix the first kind and do nothing for the second.

Combine two approximate numbers and their errors combine too. Add $p=12.5\pm0.05$ to $q=8.2\pm0.02$ and absolute errors add: at worst $0.05+0.02=0.07$. Multiply the same two numbers and relative errors add instead — about $0.0064$, converting back to roughly $0.66$ on the product $102.5$.
