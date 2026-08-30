---
# Alternative body for definite-integrals.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: definite-integrals.intuition.shaken
concept_id: definite-integrals
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: definite-integrals.intuition
for_stance: shaken
---

Split $\int_0^2 x\,dx$ into $4$ thin strips of width $0.5$. Heights at the strip starts are $0,\,0.5,\,1,\,1.5$, so the strip areas are $0,\,0.25,\,0.5,\,0.75$ — total $1.5$. Use $8$ strips instead and the running total creeps closer to $2$. Infinitely many strips would give the exact value.

There is a shortcut that skips the slicing entirely. Find an antiderivative, $F(x)=\frac{x^2}{2}$, and just subtract: $F(2)-F(0)=2-0=2$. Same number the strips were closing in on — that agreement is the Fundamental Theorem of Calculus: $\int_a^b f(x)\,dx=F(b)-F(a)$.

One shortcut worth keeping: $\int_0^2 (x+1)\,dx=\int_0^2 x\,dx+\int_0^2 1\,dx=2+2=4$ — split a sum apart, integrate each piece on its own, add the results back.
