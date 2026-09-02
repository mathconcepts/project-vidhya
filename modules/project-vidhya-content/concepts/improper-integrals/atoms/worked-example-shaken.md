---
# Alternative body for improper-integrals.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: improper-integrals.worked_example.shaken
concept_id: improper-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.3
exam_ids: ["*"]
scaffold_fade: true
variant_of: improper-integrals.worked_example
for_stance: shaken
---

**Problem.** $\int_0^1 x^{-1/2}\,dx$.

**Step 1.** Integrand is undefined at $x=0$ — Type II, singularity at the lower bound.

**Step 2.** Back off: $\int_\varepsilon^1 x^{-1/2}dx=\left[2x^{1/2}\right]_\varepsilon^1=2-2\sqrt\varepsilon$.

**Step 3.** Let $\varepsilon\to0^+$: $2-2\sqrt\varepsilon\to2-0=2$.

**Answer.**
$$
\boxed{2}
$$

**Check.** $p=\tfrac12<1$ at a point-singularity means convergent — matches the finite answer found.
