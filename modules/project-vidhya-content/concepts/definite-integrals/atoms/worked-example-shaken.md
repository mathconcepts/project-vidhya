---
# Alternative body for definite-integrals.worked_example, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: definite-integrals.worked_example.shaken
concept_id: definite-integrals
atom_type: worked_example
bloom_level: 3
difficulty: 0.2
exam_ids: ["*"]
scaffold_fade: true
variant_of: definite-integrals.worked_example
for_stance: shaken
---

**Problem.** $\int_0^1 \frac{2x}{1+x^2}\,dx$.

**Step 1.** Let $u=1+x^2$. Then $du=2x\,dx$ — matches the numerator exactly.

**Step 2.** New limits: $x=0\Rightarrow u=1$; $x=1\Rightarrow u=2$.

**Step 3.** $\int_1^2\frac{du}{u}=\left[\ln u\right]_1^2=\ln2-\ln1=\ln2$.

**Answer.**
$$
\boxed{\ln 2\approx 0.6931}
$$

**Check.** $\dfrac{d}{dx}\ln(1+x^2)=\dfrac{2x}{1+x^2}$ — matches the original integrand.
