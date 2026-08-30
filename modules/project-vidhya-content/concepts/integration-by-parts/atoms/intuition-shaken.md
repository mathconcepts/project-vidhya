---
# Alternative body for integration-by-parts.intuition, served when the
# learner stance is `shaken`. The base file is what a steady student reads.
# See src/content/stance-variants.ts for how this is selected.
#
# Written for a student who is low on this concept and low on confidence:
# smallest true first step, concrete numbers before symbols, picture before
# formula, and the check made explicit. No praise, no reassurance, and no
# mention of how the reader might be feeling — a small win is what steadies
# someone, not being told they are struggling.
id: integration-by-parts.intuition.shaken
concept_id: integration-by-parts
atom_type: intuition
bloom_level: 2
difficulty: 0.25
exam_ids: ["*"]
scaffold_fade: true
variant_of: integration-by-parts.intuition
for_stance: shaken
---

Take $\int x\cos x\,dx$. Two factors: $x$ (algebraic) and $\cos x$ (trig). Differentiating $x$ gives $1$ — simpler. Differentiating $\cos x$ gives $-\sin x$ — no simpler. So make $x$ the one you differentiate: $u=x$, $dv=\cos x\,dx$, giving $du=dx$, $v=\sin x$.

Plug into $\int u\,dv=uv-\int v\,du$: $\int x\cos x\,dx=x\sin x-\int\sin x\,dx=x\sin x+\cos x+C$.

Check by differentiating: $\frac{d}{dx}[x\sin x+\cos x]=\sin x+x\cos x-\sin x=x\cos x$. Matches.

LIATE names which factor to differentiate, in priority order: log, inverse trig, algebraic, trig, exponential — whichever type appears first in that list becomes $u$. Here $x$ (algebraic) outranks $\cos x$ (trig), the choice that worked above.

Some products need this done twice: $\int x^2 e^x\,dx$ lowers the power of $x$ by one each pass, from $x^2$ to $x$ to gone, getting closer to something integrable directly each time.

Pick $u$ so that differentiating it makes the problem simpler, not harder — that single check decides the whole setup.
