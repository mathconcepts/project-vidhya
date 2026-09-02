---
id: mean-value-theorems.interleaved-drill
concept_id: mean-value-theorems
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.60
exam_ids: ["*"]
modality: drill
tested_by_atom: mean-value-theorems.micro-exercise
---

**Cross-concept check: continuity → Mean Value Theorem.**

$f(x) = \dfrac1x$ on $[-1,1]$.

**Question 1 (continuity):** Is $f$ continuous on the closed interval $[-1,1]$?

*Answer:* No — $f$ is undefined at $x=0$, which sits inside $[-1,1]$. There is no way to define $f(0)$ that keeps the function continuous there, since $f(x)\to+\infty$ as $x\to0^+$ and $f(x)\to-\infty$ as $x\to0^-$.

**Question 2 (Mean Value Theorem):** Does MVT guarantee some $c\in(-1,1)$ with $f'(c)=\dfrac{f(1)-f(-1)}{1-(-1)}$?

*Answer:* No — MVT's continuity-on-$[a,b]$ hypothesis fails at $x=0$, so the theorem simply does not apply. (For the record, $f'(x)=-1/x^2$ is never zero or positive, so no such $c$ could exist anyway — consistent with the hypothesis failing.)

**Why this drill exists:** students often check "is $f$ differentiable where I need it" and skip verifying continuity on the *entire* closed interval, especially when the discontinuity sits inside the interval rather than at an endpoint. A function can look smooth everywhere it's defined and still fail MVT entirely because of one bad interior point.
