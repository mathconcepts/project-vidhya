---
id: integration-by-parts.exam-pattern
concept_id: integration-by-parts
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.45
exam_ids: ["*"]
modality: text
---

**How GATE actually asks this.**

- **NAT questions typically want a definite integral requiring one clean application of by-parts** — the numeric value after evaluating $[uv]_a^b-\int_a^b v\,du$ at the bounds.

  Example: $\int_0^1 xe^x\,dx=\big[xe^x-e^x\big]_0^1=(e-e)-(0-1)=1$.

- **MCQ questions often test the $u,dv$ split itself** — offering the reversed choice (exponential as $u$, algebraic as $dv$) as a distractor, since it technically satisfies the formula but produces a HARDER integral than the one you started with, not a simpler one.

- **Repeated-application problems (polynomial degree $\ge2$ times exponential/trig) test whether you track signs across passes** — the outer minus sign must multiply through the *entire* inner result, not just its leading term.

- **Time budget:** budget roughly 60–90 seconds per application of the formula; a problem needing two applications should still finish comfortably under 3 minutes if the $u,dv$ choice was right the first time.
