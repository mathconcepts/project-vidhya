---
id: applications-of-derivatives.interleaved-drill
concept_id: applications-of-derivatives
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.5
exam_ids: ["*"]
modality: drill
tested_by_atom: continuity-differentiability-jee.micro-exercise
---

**Cross-concept check: differentiability → Rolle's Theorem.**

$f(x)=|x-2|$ on $[0,4]$.

**Question 1 (continuity and differentiability):** Is $f$ differentiable on the open interval $(0,4)$?

*Answer:* No. $f$ has a corner at $x=2$, which lies inside $(0,4)$. The left-hand derivative there is $-1$ and the right-hand derivative is $+1$ — they disagree, so $f'(2)$ does not exist, even though $f$ is continuous everywhere on $[0,4]$.

**Question 2 (applications of derivatives):** Does Rolle's Theorem apply to $f$ on $[0,4]$?

*Answer:* No. $f(0)=|0-2|=2$ and $f(4)=|4-2|=2$ — the endpoint values match, satisfying one hypothesis. But Rolle's Theorem also requires differentiability on the *entire* open interval $(0,4)$, and Question 1 already found that fails at $x=2$. Matching endpoint values alone is never enough.

**Why this drill exists:** students often check "do the endpoints match" and stop there, treating it as the whole test for Rolle's Theorem. The differentiability check is not a formality — it is the condition most likely to fail when a function is built from an absolute value or a piecewise definition, exactly the shapes JEE favours for this trap.
