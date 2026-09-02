---
id: integration-by-parts.mnemonic
concept_id: integration-by-parts
atom_type: mnemonic
bloom_level: 2
difficulty: 0.30
exam_ids: ["*"]
modality: mnemonic
---

**LIATE** ranks which factor becomes $u$: **L**ogarithmic, **I**nverse trig, **A**lgebraic, **T**rigonometric, **E**xponential — whichever type appears earliest in that list is $u$; the rest becomes $dv$.

**Worked check:** $\int x\ln x\,dx$. Between $\ln x$ (Logarithmic) and $x$ (Algebraic), L outranks A, so $u=\ln x$, $dv=x\,dx$, giving $du=\frac1x\,dx$, $v=\frac{x^2}2$. Then $\int x\ln x\,dx=\frac{x^2}2\ln x-\int\frac{x^2}2\cdot\frac1x\,dx=\frac{x^2}2\ln x-\frac{x^2}4+C$.

**Sanity-check reflex:** after choosing $u$ by LIATE, check that $\int v\,du$ is genuinely simpler than the original — if it isn't, the wrong factor was differentiated, regardless of what the acronym said.
