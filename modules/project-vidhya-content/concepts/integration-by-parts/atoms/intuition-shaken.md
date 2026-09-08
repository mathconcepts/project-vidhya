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

Take $\int xe^x\,dx$. Two factors: $x$ (algebraic) and $e^x$ (exponential). Differentiating $x$ gives $1$ — simpler. Differentiating $e^x$ gives $e^x$ back — no simpler, but $e^x$ is just as easy to integrate as it is to differentiate. So make $x$ the one you differentiate: $u=x$, $dv=e^x\,dx$, giving $du=dx$, $v=e^x$.

Plug into $\int u\,dv=uv-\int v\,du$: $\int xe^x\,dx=xe^x-\int e^x\,dx=xe^x-e^x+C$.

Check by differentiating: $\frac{d}{dx}[xe^x-e^x]=e^x+xe^x-e^x=xe^x$. Matches.

LIATE names which factor to differentiate, in priority order: log, inverse trig, algebraic, trig, exponential — whichever type appears first in that list becomes $u$. Here $x$ (algebraic) outranks $e^x$ (exponential), the choice that worked above.

Some products need this done twice: $\int x^2 e^x\,dx$ lowers the power of $x$ by one each pass, from $x^2$ to $x$ to gone, getting closer to something integrable directly each time.

Pick $u$ so that differentiating it makes the problem simpler, not harder — that single check decides the whole setup.
