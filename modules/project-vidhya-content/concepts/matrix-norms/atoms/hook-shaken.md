---
# Alternative body for matrix-norms.hook, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, the arithmetic
# done in full, and an explicit check. No praise, no reassurance.
id: matrix-norms.hook.shaken
concept_id: matrix-norms
atom_type: hook
bloom_level: 1
difficulty: 0.0
exam_ids: ["*"]
variant_of: matrix-norms.hook
for_stance: shaken
---

Pick a matrix $A$. Solve $Ax=b$. Now change $b$ by a tiny amount — say $0.1\%$.

For some matrices, $x$ also moves by about $0.1\%$. Safe.

For others, that same $0.1\%$ nudge moves $x$ by $500\%$. Dangerous — and nothing in $A$'s entries looks unusual either way.

One number tells them apart before you solve anything: how much $A$ stretches its most-stretched direction compared to its least-stretched one. That ratio is the **condition number**.
