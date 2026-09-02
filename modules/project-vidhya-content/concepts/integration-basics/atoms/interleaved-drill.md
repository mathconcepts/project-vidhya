---
id: integration-basics.interleaved-drill
concept_id: integration-basics
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.55
exam_ids: ["*"]
modality: drill
tested_by_atom: integration-basics.micro-exercise
---

**Cross-concept check: derivatives → integration basics.**

**Question 1 (derivatives):** Differentiate $g(x)=2x^3$.

*Answer:* $g'(x)=6x^2$, by the power rule ($3\cdot2x^{3-1}$).

**Question 2 (integration basics):** Integrate $\int 6x^2\,dx$.

*Answer:* $\int6x^2\,dx=6\cdot\dfrac{x^3}{3}+C=2x^3+C$ — exactly $g(x)$ again, up to the constant.

**Why this drill exists:** integration and differentiation are inverse operations, but students often practice them as two unrelated skill lists instead of as round-trips of each other. Running a derivative forward and its integral backward on the same function is the fastest way to catch a dropped coefficient in either direction — if the round trip doesn't return the function you started with (up to $+C$), one of the two steps has an arithmetic error.
