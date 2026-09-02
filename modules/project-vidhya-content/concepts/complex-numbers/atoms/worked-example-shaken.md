---
# Alternative body for complex-numbers.worked_example, served when the learner stance is
# `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling.
id: complex-numbers.worked-example.shaken
concept_id: complex-numbers
atom_type: worked_example
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
variant_of: complex-numbers.worked-example.multiply
for_stance: shaken
---

**Problem:** Compute $(2+3i)(1-2i)$.

**Step 1 — Distribute.** $2(1)+2(-2i)+3i(1)+3i(-2i)=2-4i+3i-6i^2$.

**Step 2 — Use $i^2=-1$.** $-6i^2=-6(-1)=6$, so the sum is $2-4i+3i+6$.

**Step 3 — Collect real and imaginary parts.** Real: $2+6=8$. Imaginary: $-4i+3i=-i$.

**Answer:** $8-i$, already in $a+bi$ form. $\boxed{8-i}$
