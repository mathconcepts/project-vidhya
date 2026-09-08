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

Drive at a steady $60$ km/h: your distance function's derivative is $60$. Integration asks the reverse: which distance function, differentiated, gives $60$? Try $F(t)=60t$: $\frac{d}{dt}[60t]=60$ — matches. Try $F(t)=60t+50$ (you started $50$ km down the road): $\frac{d}{dt}[60t+50]=60$ too, since the constant $50$ vanishes on differentiating. Both are valid antiderivatives; they differ only by a constant, so the whole family is written at once: $\int 60\,dt=60t+C$.

The basic formulas run differentiation backward, one rule at a time. Power rule: $\frac{d}{dx}[x^{n+1}]=(n+1)x^n$, so dividing by $n+1$ undoes it: $\int x^n\,dx=\frac{x^{n+1}}{n+1}+C$. Since $\frac{d}{dx}[-\cos x]=\sin x$, then $\int\sin x\,dx=-\cos x+C$. Since $\frac{d}{dx}[e^x]=e^x$, then $\int e^x\,dx=e^x+C$ — this one reverses onto itself.

Check any answer by differentiating it back: if the result matches the original integrand, the antiderivative is right.
