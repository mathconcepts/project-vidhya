---
id: definite-integrals.interleaved_drill
concept_id: definite-integrals
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
---

**Cross-concept check: integration-by-parts → definite-integrals.**

**Q1 (integration by parts).** Find the antiderivative of $xe^x$.

**A1.** With $u=x$, $dv=e^x\,dx$: $\int xe^x\,dx=xe^x-\int e^x\,dx=xe^x-e^x+C=(x-1)e^x+C$.

**Q2 (definite integrals).** Now evaluate $\int_0^1 xe^x\,dx$ using that antiderivative.

**A2.** $\left[(x-1)e^x\right]_0^1=(1-1)e^1-(0-1)e^0=0-(-1)=1$.
$$
\boxed{\int_0^1 xe^x\,dx=1}
$$

**Why this drill exists.** The by-parts algebra and the bound evaluation get graded as one continuous step under time pressure, and the sign at the LOWER bound — $(0-1)e^0=-1$, then subtracted — is exactly where a rushed solver drops a negative and reports $0$ instead of $1$.
