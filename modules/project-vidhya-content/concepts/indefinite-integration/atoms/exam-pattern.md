---
id: indefinite-integration.exam-pattern
concept_id: indefinite-integration
atom_type: exam_pattern
bloom_level: 3
difficulty: 0.42
modality: text
exam_ids: ["*"]
---

**How JEE actually asks this.**

- **MCQ: differentiate the options, don't integrate the question.** JEE integration MCQs give you four candidate antiderivatives. Differentiating each option and comparing to the integrand is very often faster than solving the integral from scratch — especially when the options look close together. This one habit alone saves more time on this topic than knowing every technique perfectly.

- **Trap: dropping the modulus inside a log answer.** Any antiderivative of the form $\ln(\text{something})$ that came from integrating $1/u$ must be $\ln|u|$, not $\ln u$ — the original integrand is defined for negative $u$ too, and $\ln u$ alone is not. An option missing the modulus bars is a very common wrong-answer choice on this topic.

- **Trap: assuming two structurally different-looking options are both wrong.** $\int \sec^2x\tan x\,dx$ has TWO completely valid answers: $\dfrac{1}{2}\tan^2 x + C$ and $\dfrac{1}{2}\sec^2 x + C$ — they look unrelated but differ only by the constant $\dfrac{1}{2}$, since $\sec^2x-\tan^2x=1$. On a "which of these is correct" question, more than one option can be right; check by differentiating, never by matching the SHAPE of the answer to what you expect.

- **Time budget:** a standard MCQ integral should take under 60 seconds once the method is identified — most of the time cost on this topic is spent choosing the wrong technique first, not doing the arithmetic. If ninety seconds pass with no clear method chosen, re-run the three-question decision rule from the top rather than pushing further into a half-started attempt.
