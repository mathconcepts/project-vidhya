---
# Alternative body for differentiability.intuition, served when the
# learner stance is `assured`. Assumes the tangent-line picture; spends
# words on the distinction that costs marks.
id: differentiability.intuition.assured
concept_id: differentiability
atom_type: intuition
bloom_level: 2
difficulty: 0.1
exam_ids: ["*"]
variant_of: differentiability.intuition
for_stance: assured
---

The distinction worth the marks: differentiability failures are not all one shape, and treating "not differentiable" as synonymous with "has a corner" misses two other standard exam constructions. A **vertical tangent** ($f(x)=x^{1/3}$ at $0$) is continuous, has matching one-sided *behavior* in the sense that both sides head toward the same infinite slope, and still fails — a slope of $\pm\infty$ is not a real number. An **oscillating-derivative** construction ($f(x)=x^2\sin(1/x)$ for $x\neq0$, $f(0)=0$) is actually differentiable at $0$ with $f'(0)=0$, yet $f'$ itself is discontinuous there — a genuinely different failure one level up, worth recognizing even if it's rarer at GATE level. Name which shape you're looking at before reaching for "not differentiable" as a blanket verdict.
