---
# Alternative body for product-quotient-rule.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: product-quotient-rule.intuition.shaken
concept_id: product-quotient-rule
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: [gate-ma]
scaffold_fade: 0
variant_of: product-quotient-rule-intuition
for_stance: shaken
---

Take $u=3$ growing to $3.1$ and $v=5$ growing to $5.2$ — think of $uv$ as a rectangle's area. Old area: $3\times5=15$. New area: $3.1\times5.2=16.12$. Change: $16.12-15=1.12$.

Split that change into pieces: $u\,\Delta v=3\times0.2=0.6$, and $v\,\Delta u=5\times0.1=0.5$. Add them: $0.6+0.5=1.1$ — close to the real change of $1.12$; the tiny leftover, $0.02$, is $\Delta u\cdot\Delta v=0.1\times0.2$, which shrinks to nothing as the changes get smaller. That is exactly why the product rule reads $\dfrac{d(uv)}{dx}=u\dfrac{dv}{dx}+v\dfrac{du}{dx}$: two pieces, one for each factor changing.

For a quotient, $f=u/v$, the pattern is $f'=\dfrac{u'v-uv'}{v^2}$ — subtraction, not addition, and the whole thing divided by $v^2$. Say-it-out-loud check: "top times bottom's slope, minus bottom times top's slope, over bottom squared."

Watch for three easy ways to lose the mark: writing $(uv)'=u'v'$ (wrong); writing $(u/v)'=u'/v'$ (also wrong); or reaching for the quotient rule when the denominator is a plain constant, where factoring it out and differentiating the numerator alone is all that's needed.

Three factors multiplied together, $u\cdot v\cdot w$, just means applying the product rule twice: treat $uv$ as one block first, then $(uv)'w+uv\,w'$.
