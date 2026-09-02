---
# Alternative body for ode-classification.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student
# reads. See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, explicit
# check at the end. No praise, no reassurance, no mention of feelings.
id: ode-classification.intuition.shaken
concept_id: ode-classification
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: ode-classification.intuition
for_stance: shaken
---

Take $y'' + y\,y' = 0$. **Order:** the highest derivative present is $y''$, so order $=2$. **Degree:** is every derivative a whole-number power? Yes — no roots, no trig of a derivative. The highest-order derivative, $y''$, appears to the power $1$, so degree $=1$. **Linearity:** check every term. $y''$ appears alone — that part looks fine. The second term is $y \cdot y'$, a product of $y$ and a derivative. That one product is enough to make the whole equation non-linear, even though $y''$ on its own looked perfectly linear.

Result: order $2$, degree $1$, non-linear. Check every term for linearity, not just the highest-order one — one clean-looking leading term does not clear the rest of the equation.
