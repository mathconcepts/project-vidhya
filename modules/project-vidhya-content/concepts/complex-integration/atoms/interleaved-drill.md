---
id: complex-integration.interleaved-drill
concept_id: complex-integration
atom_type: interleaved_drill
bloom_level: 4
difficulty: 0.6
exam_ids: ["*"]
modality: drill
tested_by_atom: complex-integration.micro-exercise
---

**Cross-concept check: complex-integration → taylor-laurent.**

**Question 1 (complex-integration):** Using the generalized Cauchy integral formula $f^{(n)}(z_0)=\frac{n!}{2\pi i}\oint_C\frac{f(z)}{(z-z_0)^{n+1}}dz$ with $f(z)=e^z$, $z_0=0$, evaluate $\oint_{|z|=1}\frac{e^z}{z^3}dz$.

*Answer:* Here $n+1=3$, so $n=2$. $f''(z)=e^z$, so $f''(0)=1$. Rearranging: $\oint_{|z|=1}\frac{e^z}{z^3}dz=2\pi i\cdot\frac{f''(0)}{2!}=2\pi i\cdot\frac12=\pi i$.

**Question 2 (taylor-laurent):** What is the coefficient $a_2$ of $z^2$ in the Taylor series of $e^z$ about $0$, and how does it relate to Question 1's answer?

*Answer:* $a_2=\frac{f''(0)}{2!}=\frac12$. Question 1's integral, divided by $2\pi i$, is exactly $a_2$ — the generalized Cauchy formula is literally the machine that produces every Taylor coefficient.

**Why this drill exists:** students often memorize "Cauchy's formula gives derivatives" and "Taylor coefficients are $f^{(n)}(z_0)/n!$" as two separate facts to recall. They're the same statement: dividing $\oint f/(z-z_0)^{n+1}\,dz$ by $2\pi i$ *is* computing $a_n$, not merely related to it.
