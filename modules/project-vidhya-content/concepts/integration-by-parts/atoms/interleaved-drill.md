---
id: integration-by-parts.interleaved-drill
concept_id: integration-by-parts
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: integration-by-parts.micro-exercise
---

**Cross-concept check: product rule → integration by parts.**

**Question 1 (product rule):** Differentiate $p(x)=xe^x$.

*Answer:* $p'(x)=e^x+xe^x$, by the product rule: $\frac{d}{dx}[x]\cdot e^x+x\cdot\frac{d}{dx}[e^x]$.

**Question 2 (by parts):** Integrate $\int xe^x\,dx$.

*Answer:* $u=x$, $dv=e^x\,dx$, so $du=dx$, $v=e^x$: $\int xe^x\,dx=xe^x-\int e^x\,dx=e^x(x-1)+C$.

**Why this drill exists:** the by-parts formula IS the product rule, integrated on both sides and rearranged — $uv=\int v\,du+\int u\,dv$ falls straight out of $(uv)'=u'v+uv'$. A student who memorizes "$uv-\int v\,du$" as an isolated trick, disconnected from Question 1's product rule, is more likely to garble the formula under exam pressure than one who sees where it comes from.
