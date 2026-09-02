---
# Alternative body for multiple-integrals.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: multiple-integrals.worked_example.shaken
concept_id: multiple-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.35
exam_ids: ["*"]
scaffold_fade: true
variant_of: multiple-integrals.worked_example
for_stance: shaken
---

**Problem.** $\int_0^1\int_0^2 xy\,dy\,dx$.

**Step 1.** Inner, over $y$: $\int_0^2 xy\,dy=x\cdot\tfrac{y^2}{2}\Big|_0^2=x\cdot2=2x$.

**Step 2.** Outer, over $x$: $\int_0^1 2x\,dx=x^2\Big|_0^1=1$.

**Answer.**
$$
\boxed{1}
$$

**Check.** Swap order: inner over $x$: $\int_0^1 xy\,dx=y\cdot\tfrac{x^2}2\Big|_0^1=\tfrac{y}2$. Outer over $y$: $\int_0^2\tfrac{y}2\,dy=\tfrac{y^2}4\Big|_0^2=1$. Same answer both ways.
