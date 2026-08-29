---
id: gram-schmidt.mnemonic
concept_id: gram-schmidt
atom_type: mnemonic
bloom_level: 2
difficulty: 0.20
exam_ids: ["*"]
modality: mnemonic
---

**"Subtract the shadow."** Each new vector casts a shadow on the space you have already built. Remove the shadow and what is left points in a genuinely new direction — orthogonal to everything before it. That is the entire algorithm.

**The projection, said out loud: "dot over dot, times the vector."**

$$\text{proj}_u(v) = \frac{\langle v, u\rangle}{\langle u, u\rangle}\, u$$

The denominator is $\langle u, u\rangle = \|u\|^2$, **not** $\|u\|$. It reduces to $1$ — and disappears — only when $u$ is already a unit vector, which is the one case the textbook formula shows you.

**The time-saver: normalize LAST.** Carry the unnormalized $u_i$ through every subtraction, then divide by norms once at the very end:

$$u_i = v_i - \sum_{j<i}\frac{\langle v_i, u_j\rangle}{\langle u_j, u_j\rangle}\,u_j, \qquad e_i = \frac{u_i}{\|u_i\|}$$

Normalizing as you go drags $\sqrt{2}$, $\sqrt{6}$, $\sqrt{3}$ through every later step and turns clean fractions into nested radicals. Deferring keeps the arithmetic in integers almost all the way.

**"Nested spans."** $\text{span}\{v_1,\dots,v_k\} = \text{span}\{u_1,\dots,u_k\}$ at every $k$ — the process never leaves the space it started in. That nesting is precisely why $R$ comes out upper triangular in $A = QR$.
