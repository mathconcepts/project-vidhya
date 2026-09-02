---
# Alternative body for numerical-error-analysis.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: numerical-error-analysis.hook.shaken
concept_id: numerical-error-analysis
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: numerical-error-analysis.hook
for_stance: shaken
---

A resistor reads $100.0\,\Omega$ on the meter; its true value is $99.7\,\Omega$. The gap is $0.3\,\Omega$ — tiny next to $100$. Put that same $0.3\,\Omega$ gap on a $1\,\Omega$ resistor instead and it is the whole thing, twice over. The raw gap never tells you whether an error is serious; only the gap divided by the size of what you measured does.
