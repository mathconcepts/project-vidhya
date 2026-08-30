---
# Alternative body for integration-basics.intuition, served when the learner
# stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: integration-basics.intuition.shaken
concept_id: integration-basics
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-basics.intuition
for_stance: shaken
---

Differentiate $f(x)=x^3$: you get $f'(x)=3x^2$. Integration asks the reverse: which function, differentiated, gives $3x^2$? Try $x^3$: $\frac{d}{dx}[x^3]=3x^2$ — matches. Try $x^3+5$: $\frac{d}{dx}[x^3+5]=3x^2$ too, since the constant $5$ vanishes. Both are valid antiderivatives; they differ only by a constant, so the whole family is written at once: $\int 3x^2\,dx=x^3+C$.

The basic formulas run differentiation backward, one rule at a time. Power rule: $\frac{d}{dx}[x^{n+1}]=(n+1)x^n$, so dividing by $n+1$ undoes it: $\int x^n\,dx=\frac{x^{n+1}}{n+1}+C$. Since $\frac{d}{dx}[-\cos x]=\sin x$, then $\int\sin x\,dx=-\cos x+C$. Since $\frac{d}{dx}[e^x]=e^x$, then $\int e^x\,dx=e^x+C$ — this one reverses onto itself.

Check any answer by differentiating it back: if the result matches the original integrand, the antiderivative is right.
