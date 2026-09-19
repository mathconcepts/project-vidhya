---
id: limits-jee.interleaved-drill
concept_id: limits-jee
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.4
exam_ids: ["*"]
modality: drill
tested_by_atom: continuity-differentiability-jee.micro-exercise
---

**Cross-concept check: limits → continuity.**

Let $\displaystyle g(x)=\frac{x^2-4}{x-2}$ for $x\neq2$, and $g(2)=k$.

**Question 1 (limits):** What is $\lim_{x\to2}g(x)$?

*Answer:* Factor first — direct substitution gives $\frac00$. $\dfrac{x^2-4}{x-2}=\dfrac{(x-2)(x+2)}{x-2}=x+2$ for $x\neq2$, so $\lim_{x\to2}g(x)=2+2=4$.

**Question 2 (continuity):** For what value of $k$ is $g$ continuous at $x=2$?

*Answer:* $k=4$. Continuity at a point needs $g(2)=\lim_{x\to2}g(x)$ — the value found in Question 1. Any other value of $k$ leaves a hole at $x=2$ that the graph jumps over: the limit still exists, but the function's own value at that point disagrees with it.

**Why this drill exists:** a removable discontinuity is nothing but an unevaluated limit sitting at a single point. Students who can compute the limit in Question 1 sometimes stall on Question 2 because they treat "find the limit" and "check continuity" as unrelated skills, when the second is just asking whether the function's stated value happens to match the first.
