---
id: limits.interleaved_drill
concept_id: limits
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: limits.micro-exercise
---

**Cross-concept check: limits → continuity.**

Let $f(x)=\dfrac{x^2-4}{x-2}$ for $x\neq 2$.

**Question 1 (limits):** Find $\displaystyle\lim_{x\to 2} f(x)$.

*Answer:* Factor: $\dfrac{x^2-4}{x-2}=\dfrac{(x-2)(x+2)}{x-2}=x+2$ for $x\neq2$, so $\lim_{x\to2}f(x)=2+2=4$.

**Question 2 (continuity):** Suppose $f(2)$ is separately defined as $5$. Is $f$ continuous at $x=2$? What if instead $f(2)$ were defined as $4$?

*Answer:* With $f(2)=5$: not continuous — the limit ($4$) and the function value ($5$) disagree, even though both individually exist. With $f(2)=4$: continuous — all three requirements (defined, limit exists, they match) are satisfied.

**Why this drill exists:** a limit computation and a continuity check share the same algebra but ask different questions — this pair is the exact place students answer the limit question correctly and then answer the continuity question on autopilot, forgetting to compare against $f(a)$ at all.
